// ============================================================
// RequestHeader — Top nav bar, title, priority badge, rejected banner
// Extracted from RequestDetail.jsx
// ============================================================
import { downloadRequestPDF, shareViaWhatsApp } from "../../utils/pdfGenerator";

function NavBtn({ icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-transparent border-none text-[13px] font-medium px-2 py-1.5 flex items-center gap-0.5 ${
        disabled ? 'cursor-default text-white/[0.15] opacity-40' : 'cursor-pointer text-emerald-400'
      }`}
    >
      {icon} {label}
    </button>
  );
}

export default function RequestHeader({
  request: r,
  status,
  priority,
  urgency,
  rate,
  onBack,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) {
  const isRejected = r.status === "rechazado";

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] sticky top-0 z-20">
        <div className="flex items-center gap-1">
          <NavBtn icon="✕" onClick={onBack} />
          <div className="w-px h-[18px] bg-white/[0.06] mx-0.5" />
          <NavBtn icon="←" label="" onClick={onPrev} disabled={!hasPrev} />
          <NavBtn icon="→" label="" onClick={onNext} disabled={!hasNext} />
        </div>

        <div className="text-xs font-semibold text-white text-center flex-1 overflow-hidden text-ellipsis whitespace-nowrap px-2">
          {r.id}
        </div>

        <div className="flex items-center gap-1.5">
          {/* PDF download */}
          <button
            onClick={() => downloadRequestPDF(r, rate)}
            className="w-7 h-7 rounded-md bg-white/[0.06] border-none cursor-pointer flex items-center justify-center text-slate-400 hover:bg-white/[0.12] hover:text-white transition-colors"
            title="Descargar PDF"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          {/* WhatsApp share */}
          <button
            onClick={() => shareViaWhatsApp(r, rate)}
            className="w-7 h-7 rounded-md bg-white/[0.06] border-none cursor-pointer flex items-center justify-center text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
            title="Compartir por WhatsApp"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
          {/* Status badge */}
          <div
            className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded whitespace-nowrap"
            style={{
              color: status.color,
              background: status.colorLight || (status.color + "14"),
              border: `1px solid ${status.color}20`,
            }}
          >
            {status.icon} {status.label}
          </div>
        </div>
      </div>

      {/* ===== TITLE + PRIORITY ===== */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-start gap-2.5 mb-1">
          <h2 className="text-xl font-semibold text-white m-0 leading-tight flex-1">
            {r.name}
          </h2>
          {priority && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0"
              style={{
                color: priority.color,
                background: priority.colorLight || (priority.color + "12"),
              }}
            >
              {priority.icon} {priority.label}
            </span>
          )}
        </div>
        {r.supplier && (
          <div className="text-xs text-slate-500 mt-0.5">
            Proveedor: {r.supplier}
          </div>
        )}
      </div>

      {/* ===== REJECTED BANNER ===== */}
      {isRejected && (
        <div className="px-5 pb-2">
          <div className="bg-red-500/[0.08] border border-red-500/[0.12] rounded-xl px-4 py-3 flex items-center gap-2.5">
            <span className="text-xl">❌</span>
            <div>
              <div className="text-[13px] font-semibold text-red-400">Solicitud Rechazada</div>
              {r.approvalHistory?.length > 0 && (
                <div className="text-xs text-red-400/80 mt-0.5">
                  {r.approvalHistory[r.approvalHistory.length - 1].note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
