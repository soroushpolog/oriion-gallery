export const config = { runtime: "edge" };

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  let title = "ORIION Collection Gallery";
  let description = "View this exclusive collection from ORIION.";
  let image = "https://oriion-gallery.vercel.app/favicon.svg";

  if (slug) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/collections?slug=eq.${slug}&select=name,images`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const data = await res.json();
      if (data && data[0]) {
        const collection = data[0];
        title = `${collection.name} — ORIION`;
        description = `${(collection.images || []).length} items in this collection.`;
        if (collection.images && collection.images[0]) {
          image = collection.images[0].src;
        }
      }
    } catch (e) {}
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=https://oriion-gallery.vercel.app/#/gallery/${slug}" />
</head>
<body>Redirecting...</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html" },
  });
}