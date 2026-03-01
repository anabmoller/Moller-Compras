// ============================================================
// YPOTI — AttachmentUpload
// Upload photos (camera/file) + preview for request attachments
// Uses Supabase Storage bucket "attachments"
// ============================================================
import { useState, useRef } from "react";
import { colors, font, radius, shadows } from "../../styles/theme";
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

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError(`Archivo muy grande (${formatFileSize(file.size)}). Máximo: 25 MB`);
      return;
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
      setError("Tipo de archivo no soportado. Use: JPG, PNG, PDF");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Generate unique file path
      const ext = file.name.split(".").pop() || "jpg";
      const timestamp = Date.now();
      const filePath = `${requestUuid}/${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(filePath);

      const newAttachment = {
        id: `att_${timestamp}`,
        name: file.name,
        path: filePath,
        url: urlData?.publicUrl || "",
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
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleRemove = async (attachment) => {
    try {
      // Remove from storage
      await supabase.storage.from("attachments").remove([attachment.path]);
    } catch (err) {
      console.error("[AttachmentUpload] Remove failed:", err);
    }
    const updated = attachments.filter(a => a.id !== attachment.id);
    if (onAttachmentsChange) onAttachmentsChange(updated);
  };

  const isImage = (type) => type?.startsWith("image/");

  return (
    <div>
      {/* Uploaded files preview */}
      {attachments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {attachments.map((att) => (
            <div key={att.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: colors.surface, borderRadius: radius.md,
              padding: "8px 12px", border: `1px solid ${colors.borderLight}`,
            }}>
              {/* Thumbnail or icon */}
              {isImage(att.type) && att.url ? (
                <img
                  src={att.url}
                  alt={att.name}
                  style={{
                    width: 44, height: 44, borderRadius: radius.sm,
                    objectFit: "cover", flexShrink: 0,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: radius.sm,
                  background: colors.primary + "10",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>
                  📄
                </div>
              )}

              {/* File info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: colors.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {att.name}
                </div>
                <div style={{ fontSize: 10, color: colors.textLight, marginTop: 1 }}>
                  {formatFileSize(att.size)}
                </div>
              </div>

              {/* View / Remove buttons */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {att.url && (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: colors.primary + "10", border: "none",
                      borderRadius: radius.sm, padding: "4px 8px",
                      fontSize: 10, color: colors.primary, fontWeight: 600,
                      textDecoration: "none", cursor: "pointer",
                    }}
                  >
                    Ver
                  </a>
                )}
                <button
                  onClick={() => handleRemove(att)}
                  style={{
                    background: colors.danger + "10", border: "none",
                    borderRadius: radius.sm, padding: "4px 8px",
                    fontSize: 10, color: colors.danger, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div style={{
        border: `2px dashed ${uploading ? colors.primary : colors.border}`,
        borderRadius: radius.lg,
        padding: "16px",
        transition: "border-color 0.2s",
      }}>
        {uploading ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{
              width: 24, height: 24, border: `3px solid ${colors.border}`,
              borderTopColor: colors.primary, borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 8px",
            }} />
            <div style={{ fontSize: 12, color: colors.primary, fontWeight: 500 }}>
              Subiendo...
            </div>
          </div>
        ) : (
          <div style={{
            display: "flex", gap: 8, justifyContent: "center",
          }}>
            {/* Camera button (mobile: opens camera) */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{
                flex: 1, padding: "12px 10px", borderRadius: radius.md,
                border: `1px solid ${colors.primary}30`,
                background: colors.primary + "06",
                cursor: "pointer", textAlign: "center",
                fontFamily: font,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>📸</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.primary }}>
                Tomar Foto
              </div>
            </button>

            {/* File upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1, padding: "12px 10px", borderRadius: radius.md,
                border: `1px solid ${colors.accent}30`,
                background: colors.accent + "06",
                cursor: "pointer", textAlign: "center",
                fontFamily: font,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>📎</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.accent }}>
                Subir Archivo
              </div>
            </button>
          </div>
        )}

        <div style={{
          fontSize: 10, color: colors.textMuted, textAlign: "center",
          marginTop: 8,
        }}>
          JPG, PNG, PDF — Máximo 25 MB
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          fontSize: 11, color: colors.danger, marginTop: 6,
          padding: "6px 10px", background: colors.danger + "08",
          borderRadius: radius.sm, fontWeight: 500,
        }}>
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
        style={{ display: "none" }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </div>
  );
}
