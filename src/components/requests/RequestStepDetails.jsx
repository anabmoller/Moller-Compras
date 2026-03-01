import { useRef } from "react";
import { PRIORITY_LEVELS } from "../../constants";

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

function fmtFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RequestStepDetails({ form, errors, onUpdateForm, FieldError, photos = [], onSetPhotos }) {
  const fileRef = useRef(null);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf") return false;
      if (f.size > MAX_SIZE_MB * 1024 * 1024) return false;
      return true;
    });
    onSetPhotos(prev => [...prev, ...valid].slice(0, MAX_FILES));
    // Reset input so same file can be selected again
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePhoto = (idx) => {
    onSetPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Prioridad</label>
        <div className="flex gap-2">
          {PRIORITY_LEVELS.map(u => (
            <button
              key={u.value}
              onClick={() => onUpdateForm("urgency", u.value)}
              className="flex-1 px-1.5 py-3 rounded-lg text-center transition-all duration-150 cursor-pointer"
              style={{
                border: form.urgency === u.value ? `2px solid ${u.color}` : '1px solid rgba(255,255,255,0.06)',
                background: form.urgency === u.value ? (u.colorLight || u.color + "10") : 'rgba(255,255,255,0.03)',
              }}
            >
              <div className="text-base">{u.icon}</div>
              <div className="text-[11px] font-semibold mt-1" style={{ color: form.urgency === u.value ? u.color : '#94a3b8' }}>
                {u.label}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">{u.days ? `${u.days}d` : `${u.hours}h`}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">¿Por qué necesitas estos productos? *</label>
        <textarea
          value={form.reason}
          onChange={e => onUpdateForm("reason", e.target.value)}
          placeholder="Justificación de la compra..."
          rows={3}
          className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 resize-y ${errors.reason ? 'border-red-500' : 'border-white/[0.1]'}`}
        />
        <FieldError field="reason" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Notas adicionales</label>
        <textarea
          value={form.notes}
          onChange={e => onUpdateForm("notes", e.target.value)}
          placeholder="Observaciones, especificaciones técnicas..."
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 resize-y"
        />
      </div>

      {/* File upload (photos + PDFs) */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">
          Adjuntos <span className="text-slate-500 font-normal">(opcional, máx {MAX_FILES}, {MAX_SIZE_MB}MB c/u)</span>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/* Thumbnail/file previews */}
        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {photos.map((file, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/[0.1]">
                {file.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/[0.05] flex flex-col items-center justify-center">
                    <span className="text-lg">📄</span>
                    <span className="text-[8px] text-slate-400">PDF</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-slate-300 text-center py-px">
                  {fmtFileSize(file.size)}
                </div>
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-none cursor-pointer rounded-bl-md"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {photos.length < MAX_FILES && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] text-xs text-slate-400 cursor-pointer"
          >
            📷 {photos.length === 0 ? "Agregar fotos o documentos" : `Agregar más (${photos.length}/${MAX_FILES})`}
          </button>
        )}
        <div className="text-[10px] text-slate-500 mt-1">
          Puedes tomar una foto directamente desde tu celular.
        </div>
      </div>
    </div>
  );
}
