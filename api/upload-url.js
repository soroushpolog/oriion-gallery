import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 is S3-compatible, so we talk to it with the standard AWS S3 client,
// just pointed at the R2 endpoint instead of AWS.
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filename, contentType } = req.body || {};
    if (!filename) {
      return res.status(400).json({ error: "filename is required" });
    }

    // Build a safe, unique object key so uploads never collide or overwrite each other
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });

    // This URL is valid for 5 minutes and lets the browser upload directly to R2
    // without ever seeing our secret key.
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return res.status(200).json({ uploadUrl, publicUrl, key });
  } catch (err) {
    console.error("upload-url error:", err);
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
}
