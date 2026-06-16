import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const ADMIN_PASSWORD = "oriion2025";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const slugify = (text) =>
  text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

const fuid = () => `f_${Date.now()}`;

function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  return fetch(url, { method: "POST", body: formData })
    .then((r) => r.json())
    .then((data) => ({ id: data.public_id, name: file.name, src: data.secure_url }));
}

// ── Customer Gallery View ──────────────────────────────────────────
function GalleryView() {
  const hash = window.location.hash.replace("#/gallery/", "");
  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    supabase.from("collections").select("*").eq("slug", hash).single()
      .then(({ data }) => { setFolder(data); setLoading(false); });
  }, [hash]);

  const images = folder?.images || [];

  const prev = () => setLightboxIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setLightboxIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, images.length]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6B6B", fontFamily: "Inter, sans-serif" }}>
      Loading...
    </div>
  );

  if (!folder) return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#6B6B6B", fontFamily: "Inter, sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>👟</div>
      <div style={{ fontSize: 16, color: "#888" }}>Collection not found</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", fontFamily: "Inter, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1E1E1E", padding: "24px 32px" }}>
        <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", color: "#C9A84C" }}>ORIION</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#F2F0EB", marginTop: 4 }}>{folder.name}</div>
        <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{images.length} items</div>
      </div>
      <div style={{ padding: "28px 32px" }}>
        {images.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "#6B6B6B" }}>
            <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 12 }}>📦</div>
            <div>No items in this collection yet</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {images.map((img, index) => (
              <div key={img.id} onClick={() => setLightboxIndex(index)}
                style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "1", border: "1px solid #1E1E1E", background: "#161616", cursor: "pointer" }}>
                <img src={img.src} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => setLightboxIndex(null)}
            style={{ position: "absolute", top: 20, right: 24, background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: 22, width: 40, height: 40, borderRadius: "50%", cursor: "pointer" }}>✕</button>
          <button onClick={prev}
            style={{ position: "absolute", left: 16, background: "rgba(255,255,255,0.15)", border: "none", color: "white", fontSize: 28, width: 44, height: 44, borderRadius: "50%", cursor: "pointer" }}>‹</button>
          <img src={images[lightboxIndex].src} alt="preview"
            style={{ maxWidth: "85vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8 }} />
          <button onClick={next}
            style={{ position: "absolute", right: 16, background: "rgba(255,255,255,0.15)", border: "none", color: "white", fontSize: 28, width: 44, height: 44, borderRadius: "50%", cursor: "pointer" }}>›</button>
          <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "#6B6B6B", fontSize: 13 }}>
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Login View ─────────────────────────────────────────────────────
function LoginView({ onLogin }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const attempt = () => {
    if (pw === ADMIN_PASSWORD) { onLogin(); }
    else { setError(true); setTimeout(() => setError(false), 2000); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ background: "#161616", border: "1px solid #262626", borderRadius: 12, padding: 40, width: 360, maxWidth: "90vw", textAlign: "center" }}>
        <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9A84C", marginBottom: 4 }}>ORIION</div>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 32 }}>Admin Access</div>
        <input type="password" placeholder="Enter password" value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          style={{ width: "100%", background: "#0D0D0D", border: `1px solid ${error ? "#C0392B" : "#262626"}`, borderRadius: 6, padding: "12px 14px", color: "#F2F0EB", fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
        {error && <div style={{ color: "#C0392B", fontSize: 12, marginBottom: 12 }}>Incorrect password</div>}
        <button onClick={attempt}
          style={{ width: "100%", background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 6, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Enter
        </button>
      </div>
    </div>
  );
}

// ── Admin Dashboard ────────────────────────────────────────────────
function AdminView({ onLogout }) {
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [gridSize, setGridSize] = useState(4);
  const [toast, setToast] = useState(null);
  const [shareModal, setShareModal] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [addFolderModal, setAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    supabase.from("collections").select("*").order("id")
      .then(({ data }) => { if (data) setFolders(data); });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const currentFolder = folders.find((f) => f.id === activeFolder) || null;
  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const addFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const slug = slugify(name);
    const newF = { id: fuid(), name, slug, images: [] };
    const { data } = await supabase.from("collections").insert(newF).select().single();
    if (data) {
      setFolders((prev) => [...prev, data]);
      setActiveFolder(data.id);
    }
    setNewFolderName("");
    setAddFolderModal(false);
    showToast("Collection created");
  };

  const deleteFolder = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this collection?")) return;
    await supabase.from("collections").delete().eq("id", id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (activeFolder === id) setActiveFolder(null);
  };

  const handleFiles = useCallback(async (files) => {
    if (!activeFolder) { showToast("Select a folder first"); return; }
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!validFiles.length) return;
    setUploading(true);
    showToast("Uploading...");
    try {
      const uploaded = await Promise.all(validFiles.map(uploadToCloudinary));
      const updatedImages = [...(currentFolder.images || []), ...uploaded];
      await supabase.from("collections").update({ images: updatedImages }).eq("id", activeFolder);
      setFolders((prev) => prev.map((f) =>
        f.id === activeFolder ? { ...f, images: updatedImages } : f
      ));
      showToast(`${uploaded.length} photo(s) uploaded`);
    } catch {
      showToast("Upload failed");
    }
    setUploading(false);
  }, [activeFolder, currentFolder]);

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };

  const deleteImage = async (imgId, e) => {
    e.stopPropagation();
    const updatedImages = currentFolder.images.filter((i) => i.id !== imgId);
    await supabase.from("collections").update({ images: updatedImages }).eq("id", activeFolder);
    setFolders((prev) => prev.map((f) =>
      f.id === activeFolder ? { ...f, images: updatedImages } : f
    ));
  };

  const  shareLink = currentFolder
    ? `${window.location.origin}/api/gallery?slug=${currentFolder.slug || currentFolder.id}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Link copied!");
    });
  };

  const totalImages = folders.reduce((sum, f) => sum + (f.images || []).length, 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0D0D0D", color: "#F2F0EB", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 270, background: "#161616", borderRight: "1px solid #262626", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid #262626" }}>
          <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9A84C" }}>ORIION</div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B6B", marginTop: 2 }}>Collection Gallery</div>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E1E1E" }}>
          <input
            placeholder="🔍 Search collections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", background: "#0D0D0D", border: "1px solid #262626", borderRadius: 6, padding: "8px 12px", color: "#F2F0EB", fontSize: 12.5, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ padding: "12px 16px 8px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 8, padding: "0 8px" }}>
            Collections {search && `(${filteredFolders.length})`}
          </div>
          {filteredFolders.map((f) => {
            const cover = (f.images || [])[0]?.src;
            return (
              <div key={f.id} onClick={() => setActiveFolder(f.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: activeFolder === f.id ? "#C9A84C" : "#AAAAAA", background: activeFolder === f.id ? "rgba(201,168,76,0.10)" : "transparent", marginBottom: 2 }}>
                {/* Cover thumbnail */}
                <div style={{ width: 36, height: 36, borderRadius: 5, overflow: "hidden", background: "#222", flexShrink: 0, border: "1px solid #2E2E2E" }}>
                  {cover
                    ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📁</div>
                  }
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: "#6B6B6B", marginTop: 1 }}>{(f.images || []).length} photos</div>
                </div>
                <button onClick={(e) => deleteFolder(f.id, e)}
                  style={{ background: "none", border: "none", color: "#C0392B", cursor: "pointer", fontSize: 13, flexShrink: 0 }}>✕</button>
              </div>
            );
          })}
          {filteredFolders.length === 0 && search && (
            <div style={{ fontSize: 12, color: "#6B6B6B", padding: "12px 8px" }}>No collections found</div>
          )}
          <button onClick={() => setAddFolderModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#6B6B6B", background: "none", border: "1px dashed #2E2E2E", width: "100%", marginTop: 8, fontFamily: "Inter, sans-serif" }}>
            + New Collection
          </button>
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid #1E1E1E" }}>
          <div style={{ fontSize: 11, color: "#6B6B6B", marginBottom: 8 }}>{folders.length} collections · {totalImages} photos</div>
          <button onClick={onLogout}
            style={{ background: "none", border: "1px solid #262626", color: "#6B6B6B", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            Log out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!currentFolder ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#6B6B6B", gap: 12 }}>
            <div style={{ fontSize: 48, opacity: 0.25 }}>👟</div>
            <div style={{ fontSize: 15 }}>Select a collection to manage</div>
            <button onClick={() => setAddFolderModal(true)}
              style={{ background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 6, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              + New Collection
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", borderBottom: "1px solid #262626", background: "#0D0D0D" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Cover in topbar */}
                {(currentFolder.images || [])[0]?.src && (
                  <div style={{ width: 48, height: 48, borderRadius: 8, overflow: "hidden", border: "1px solid #262626", flexShrink: 0 }}>
                    <img src={currentFolder.images[0].src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{currentFolder.name}</div>
                  <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{(currentFolder.images || []).length} photos</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShareModal(true)}
                  style={{ background: "transparent", border: "1px solid #262626", color: "#F2F0EB", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                  🔗 Share Link
                </button>
                <button onClick={() => fileInput.current?.click()} disabled={uploading}
                  style={{ background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 6, padding: "9px 18px", fontWeight: 600, cursor: "pointer", fontSize: 13, opacity: uploading ? 0.7 : 1 }}>
                  {uploading ? "Uploading..." : "+ Add Photos"}
                </button>
              </div>
            </div>

            <div style={{ padding: "28px 32px", flex: 1, overflowY: "auto" }}>
              <div onClick={() => fileInput.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{ border: `1.5px dashed ${dragOver ? "#8A6F2E" : "#2E2E2E"}`, borderRadius: 10, padding: "36px 24px", textAlign: "center", cursor: "pointer", marginBottom: 28, background: dragOver ? "rgba(201,168,76,0.04)" : "transparent" }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📸</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Drop photos here or click to upload</div>
                <div style={{ fontSize: 12, color: "#6B6B6B" }}>JPG, PNG, WEBP — stored permanently</div>
              </div>
              <input ref={fileInput} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />

              {(currentFolder.images || []).length > 0 ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6B6B" }}>{(currentFolder.images || []).length} items</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[2, 3, 4].map((n) => (
                        <button key={n} onClick={() => setGridSize(n)}
                          style={{ background: "none", border: `1px solid ${gridSize === n ? "#8A6F2E" : "#262626"}`, color: gridSize === n ? "#C9A84C" : "#6B6B6B", padding: "5px 8px", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>
                          {n === 2 ? "▦" : n === 3 ? "⊞" : "⊟"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 12 }}>
                    {(currentFolder.images || []).map((img) => (
                      <div key={img.id} onClick={() => setLightbox(img.src)}
                        style={{ position: "relative", borderRadius: 6, overflow: "hidden", background: "#1A1A1A", aspectRatio: "1", border: "1px solid #262626", cursor: "pointer" }}>
                        <img src={img.src} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", padding: 10 }}>
                          <button onClick={(e) => deleteImage(img.id, e)}
                            style={{ background: "rgba(192,57,43,0.7)", border: "none", color: "white", padding: "3px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 24px", color: "#6B6B6B" }}>
                  <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.4 }}>👟</div>
                  <div style={{ fontSize: 15, marginBottom: 6 }}>No photos yet</div>
                  <div style={{ fontSize: 13 }}>Upload your first collection photos above</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {shareModal && (
        <div onClick={() => setShareModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#161616", border: "1px solid #262626", borderRadius: 12, padding: 32, width: 480, maxWidth: "92vw" }}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Share "{currentFolder?.name}"</div>
            <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 24 }}>Permanent link — customers see photos only, no controls.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0D0D0D", border: "1px solid #262626", borderRadius: 6, padding: "10px 14px", marginBottom: 20 }}>
              <span style={{ flex: 1, fontSize: 12, color: "#C9A84C", fontFamily: "monospace", wordBreak: "break-all" }}>{shareLink}</span>
              <button onClick={copyLink}
                style={{ background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 4, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShareModal(false)}
                style={{ background: "transparent", border: "1px solid #262626", color: "#F2F0EB", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {addFolderModal && (
        <div onClick={() => setAddFolderModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#161616", border: "1px solid #262626", borderRadius: 12, padding: 32, width: 480, maxWidth: "92vw" }}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>New Collection</div>
            <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 16 }}>Name your collection (e.g. "Nike Dunk 2025")</div>
            <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFolder()}
              placeholder="Collection name..."
              style={{ width: "100%", background: "#0D0D0D", border: "1px solid #262626", borderRadius: 6, padding: "10px 14px", color: "#F2F0EB", fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setAddFolderModal(false)}
                style={{ flex: 1, background: "transparent", border: "1px solid #262626", color: "#F2F0EB", borderRadius: 6, padding: "10px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                Cancel
              </button>
              <button onClick={addFolder}
                style={{ flex: 1, background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 6, padding: "10px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <button onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 20, right: 24, background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: 22, width: 40, height: 40, borderRadius: "50%", cursor: "pointer" }}>✕</button>
          <img src={lightbox} alt="preview" onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1E1E1E", border: "1px solid #262626", borderLeft: "3px solid #C9A84C", borderRadius: 6, padding: "12px 18px", fontSize: 13, color: "#F2F0EB", zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem("oriion_auth") === "true");
  const isGalleryView = window.location.hash.startsWith("#/gallery/");

  if (isGalleryView) return <GalleryView />;
  if (!loggedIn) return <LoginView onLogin={() => { sessionStorage.setItem("oriion_auth", "true"); setLoggedIn(true); }} />;
  return <AdminView onLogout={() => { sessionStorage.removeItem("oriion_auth"); setLoggedIn(false); }} />;
}