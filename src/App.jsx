import { useState, useRef, useCallback } from "react";

let imgId = 1;
const uid = () => `img_${Date.now()}_${imgId++}`;
const fuid = () => `f_${Date.now()}`;

export default function App() {
  const [folders, setFolders] = useState([
    { id: "f_demo1", name: "Nike Air Max 2025", images: [] },
    { id: "f_demo2", name: "Hermes Sneakers", images: [] },
  ]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [gridSize, setGridSize] = useState(4);
  const [toast, setToast] = useState(null);
  const [shareModal, setShareModal] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [addFolderModal, setAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInput = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const currentFolder = folders.find((f) => f.id === activeFolder) || null;

  const addFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const f = { id: fuid(), name, images: [] };
    setFolders((prev) => [...prev, f]);
    setActiveFolder(f.id);
    setNewFolderName("");
    setAddFolderModal(false);
    showToast("Collection created");
  };

  const deleteFolder = (id, e) => {
    e.stopPropagation();
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (activeFolder === id) setActiveFolder(null);
  };

  const handleFiles = useCallback(
    (files) => {
      if (!activeFolder) {
        showToast("Select a folder first");
        return;
      }
      const validFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (!validFiles.length) return;
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = { id: uid(), name: file.name, src: e.target.result };
          setFolders((prev) =>
            prev.map((f) =>
              f.id === activeFolder
                ? { ...f, images: [...f.images, img] }
                : f
            )
          );
        };
        reader.readAsDataURL(file);
      });
      showToast(`${validFiles.length} photo(s) added`);
    },
    [activeFolder]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const deleteImage = (imgId, e) => {
    e.stopPropagation();
    setFolders((prev) =>
      prev.map((f) =>
        f.id === activeFolder
          ? { ...f, images: f.images.filter((i) => i.id !== imgId) }
          : f
      )
    );
  };

  const copyLink = () => {
    const link = `${window.location.origin}/gallery/${activeFolder}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Link copied!");
    });
  };

  const totalImages = folders.reduce((sum, f) => sum + f.images.length, 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0D0D0D", color: "#F2F0EB", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: "#161616", borderRight: "1px solid #262626", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
        <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid #262626" }}>
          <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9A84C" }}>ORIION</div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B6B6B", marginTop: 2 }}>Collection Gallery</div>
        </div>
        <div style={{ padding: "20px 16px 8px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#6B6B6B", marginBottom: 8, padding: "0 8px" }}>Collections</div>
          {folders.map((f) => (
            <div key={f.id} onClick={() => setActiveFolder(f.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13.5, color: activeFolder === f.id ? "#C9A84C" : "#AAAAAA", background: activeFolder === f.id ? "rgba(201,168,76,0.10)" : "transparent", marginBottom: 2 }}>
              <span>📁</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
              <span style={{ fontSize: 11, color: "#6B6B6B", background: "#222", borderRadius: 20, padding: "1px 7px" }}>{f.images.length}</span>
              <button onClick={(e) => deleteFolder(f.id, e)}
                style={{ background: "none", border: "none", color: "#C0392B", cursor: "pointer", fontSize: 13 }}>✕</button>
            </div>
          ))}
          <button onClick={() => setAddFolderModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#6B6B6B", background: "none", border: "1px dashed #2E2E2E", width: "100%", marginTop: 4, fontFamily: "Inter, sans-serif" }}>
            + New Collection
          </button>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid #1E1E1E", fontSize: 11, color: "#6B6B6B" }}>
          {folders.length} collections · {totalImages} photos
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
              <div>
                <div style={{ fontFamily: "sans-serif", fontSize: 20, fontWeight: 600 }}>{currentFolder.name}</div>
                <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>{currentFolder.images.length} photos</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShareModal(true)}
                  style={{ background: "transparent", border: "1px solid #262626", color: "#F2F0EB", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                  🔗 Share Link
                </button>
                <button onClick={() => fileInput.current?.click()}
                  style={{ background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 6, padding: "9px 18px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                  + Add Photos
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
                <div style={{ fontSize: 12, color: "#6B6B6B" }}>JPG, PNG, WEBP</div>
              </div>
              <input ref={fileInput} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />

              {currentFolder.images.length > 0 ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B6B6B" }}>{currentFolder.images.length} items</div>
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
                    {currentFolder.images.map((img) => (
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

      {/* Share Modal */}
      {shareModal && (
        <div onClick={() => setShareModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#161616", border: "1px solid #262626", borderRadius: 12, padding: 32, width: 480, maxWidth: "92vw" }}>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Share "{currentFolder?.name}"</div>
            <div style={{ fontSize: 13, color: "#6B6B6B", marginBottom: 24 }}>This link never expires. Send it directly to customers.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0D0D0D", border: "1px solid #262626", borderRadius: 6, padding: "10px 14px", marginBottom: 20 }}>
              <span style={{ flex: 1, fontSize: 12.5, color: "#C9A84C", fontFamily: "monospace", wordBreak: "break-all" }}>
                {`${window.location.origin}/gallery/${activeFolder}`}
              </span>
              <button onClick={copyLink}
                style={{ background: "#C9A84C", color: "#0D0D0D", border: "none", borderRadius: 4, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShareModal(false)}
                style={{ background: "transparent", border: "1px solid #262626", color: "#F2F0EB", borderRadius: 6, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Folder Modal */}
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
              style={{ width: "100%", background: "#0D0D0D", border: "1px solid #262626", borderRadius: 6, padding: "10px 14px", color: "#F2F0EB", fontSize: 13.5, fontFamily: "Inter, sans-serif", outline: "none" }} />
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

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <button onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 20, right: 24, background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: 22, width: 40, height: 40, borderRadius: "50%", cursor: "pointer" }}>
            ✕
          </button>
          <img src={lightbox} alt="preview" onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#1E1E1E", border: "1px solid #262626", borderLeft: "3px solid #C9A84C", borderRadius: 6, padding: "12px 18px", fontSize: 13, color: "#F2F0EB", zIndex: 200 }}>
          {toast}
        </div>
      )}
    </div>
  );
}