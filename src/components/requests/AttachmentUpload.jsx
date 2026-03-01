// ============================================================
// YPOTI — AttachmentUpload
// Upload photos (camera/file) + preview for request attachments
// Uses Supabase Storage bucket "attachments"
// ============================================================
import { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentUpload({ requestUuid, attachments = [], onAttachmentsChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const uploadFile = async (file) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`Archivo muy grande (${formatFileSize(file.size)}). Máximo: 25 MB`);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
      setError("Tipo de archivo no soportado. Use: JPG, PNG, PDF");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const timestamp = Date.now();
      const filePath = `${requestUuid}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      const { data, error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Use signed URL (works for both public and private buckets)
      const { data: urlData } = await supabase.storage
        .from("attachments")
        .createSignedUrl(filePath, 3600);

      const newAttachment = {
        id: `att_${timestamp}`,
        name: file.name,
        path: filePath,
        url: urlData?.signedUrl || "",
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      };

      const updated = [...attachments, newAttachment];
      if (onAttachmentsChange) onAttachmentsChange(updated);
    } catch (err) {
      console.error("[AttachmentUpload] Upload failed:", err);
      setError(err.message || "Error al subir archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleRemove = async (attachment) => {
    try {
      await supabase.storage.from("attachments").remove([attachment.path]);
    } catch (err) {
      console.error("[AttachmentUpload] Remove failed:", err);
    }
    const updated = attachments.filter(a => a.id !== attachment.id);
    if (onAttachmentsChange) onAttachmentsChange(updated);
  };

  const isImage = (type) => type?.startsWith("image/");

  // Generate a fresh signed URL on demand (handles expired stored URLs)
  const openAttachment = async (att) => {
    if (att.path) {
      try {
        const { data } = await supabase.storage
          .from("attachments")
          .createSignedUrl(att.path, 3600);
        if (data?.signedUrl) {
          window.open(data.signedUrl, "_blank");
          return;
        }
      } catch { /* fall through to stored URL */ }
    }
    if (att.url) window.open(att.url, "_blank");
  };

  return (
    <div>
      {/* Uploaded files preview */}
      {attachments.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-3">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2.5 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.06]">
              {/* Thumbnail or icon */}
              {isImage(att.type) && att.url ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className="w-11 h-11 rounded object-cover flex-shrink-0 border border-white/[0.06]"
                />
              ) : (
                <div className="w-11 h-11 rounded bg-emerald-500/[0.06] flex items-center justify-center text-lg flex-shrink-0">
                  📄
                </div>
              )}

              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white overflow-hidden text-ellipsis whitespace-nowrap">
                  {att.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-px">
                  {formatFileSize(att.size)}
                </div>
              </div>

              {/* View / Remove buttons */}
              <div className="flex gap-1 flex-shrink-0">
                {(att.path || att.url) && (
                  <button
                    onClick={() => openAttachment(att)}
                    className="bg-emerald-500/[0.06] border-none rounded px-2 py-1 text-[10px] text-emerald-400 font-semibold cursor-pointer"
                  >
                    Ver
                  </button>
                )}
                <button
                  onClick={() => handleRemove(att)}
                  className="bg-red-500/[0.06] border-none rounded px-2 py-1 text-[10px] text-red-400 font-semibold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div className={`border-2 border-dashed rounded-xl p-4 transition-colors duration-200 ${uploading ? 'border-emerald-500' : 'border-white/[0.06]'}`}>
        {uploading ? (
          <div className="text-center py-2">
            <div className="w-6 h-6 border-[3px] border-white/[0.06] border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            <div className="text-xs text-emerald-400 font-medium">
              Subiendo...
            </div>
          </div>
        ) : (
          <div className="flex gap-2 justify-center">
            {/* Camera button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 py-3 px-2.5 rounded-lg border border-emerald-500/[0.19] bg-emerald-500/[0.04] cursor-pointer text-center"
            >
              <div className="text-xl mb-1">📸</div>
              <div className="text-[11px] font-semibold text-emerald-400">
                Tomar Foto
              </div>
            </button>

            {/* File upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 px-2.5 rounded-lg border border-blue-400/[0.19] bg-blue-400/[0.04] cursor-pointer text-center"
            >
              <div className="text-xl mb-1">📎</div>
              <div className="text-[11px] font-semibold text-blue-400">
                Subir Archivo
              </div>
            </button>
          </div>
        )}

        <div className="text-[10px] text-slate-500 text-center mt-2">
          JPG, PNG, PDF — Máximo 25 MB
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-[11px] text-red-400 mt-1.5 px-2.5 py-1.5 bg-red-500/[0.05] rounded font-medium">
          {error}
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
