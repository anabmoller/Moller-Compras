// ============================================================
// RequestTimeline — Trazabilidad (approval history + pipeline)
//                   + Attachments section
// Extracted from RequestDetail.jsx
// ============================================================
import { STATUS_FLOW } from "../../constants";
import { fmtDate, fmtDateTime } from "../../utils/dateFormatters";


function SectionTitle({ children, count, collapsed, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center justify-between select-none ${collapsed ? '' : 'mb-3'} ${onToggle ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
        {children}
        {count != null && (
          <span className="bg-emerald-500/[0.08] text-emerald-400 text-[10px] font-bold px-1.5 py-px rounded-md min-w-[18px] text-center">
            {count}
          </span>
        )}
      </div>
      {onToggle && (
        <span
          className="text-sm text-slate-400 transition-transform duration-200"
          style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0)" }}
        >
          ▾
        </span>
      )}
    </div>
  );
}

export default function RequestTimeline({
  request: r,
  statusIdx,
  showTrazabilidad,
  onToggleTrazabilidad,
}) {
  return (
    <>
      {/* ===== TRAZABILIDAD (collapsible) ===== */}
      <div className="px-5 py-2">
        <SectionTitle
          count={(r.approvalHistory?.length || 0) + STATUS_FLOW.length}
          collapsed={!showTrazabilidad}
          onToggle={onToggleTrazabilidad}
        >
          Trazabilidad
        </SectionTitle>

        {/* Always show last 3 approval history entries */}
        {r.approvalHistory?.length > 0 && (
          <div className={showTrazabilidad ? 'mb-2' : ''}>
            {(showTrazabilidad ? r.approvalHistory : r.approvalHistory.slice(-3)).map((entry, i) => {
              const actionStyles = {
                confirmed: { icon: "📤", color: "#3b82f6", label: "Confirmada" },
                approved: { icon: "✅", color: "#22c55e", label: "Aprobada" },
                rejected: { icon: "❌", color: "#ef4444", label: "Rechazada" },
                revision: { icon: "↩", color: "#f59e0b", label: "Devuelta" },
                advanced: { icon: "→", color: "#10b981", label: "Avanzada" },
                cancelled: { icon: "🚫", color: "#ef4444", label: "Cancelada" },
              };
              const a = actionStyles[entry.action] || { icon: "•", color: "#94a3b8", label: entry.action };
              return (
                <div key={i} className="flex gap-2.5 mb-1.5 p-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-sm">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold" style={{ color: a.color }}>
                      {entry.step ? `${entry.step}: ` : ""}{a.label}
                      {entry.note ? ` — ${entry.note}` : ""}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-px">
                      {entry.by} · {fmtDateTime(entry.at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pipeline timeline (shown when expanded) */}
        {showTrazabilidad && (() => {
          // Build lookup: status key → who performed the action
          const statusPerformers = {};
          if (r.approvalHistory) {
            for (const entry of r.approvalHistory) {
              const actionToStatus = {
                confirmed: "confirmado",
                approved: r.approvalHistory.filter(e => e.action === "approved").length > 1 ? null : "aprobado",
                advanced: entry.step?.toLowerCase().includes("presup") ? "presupuestado" : null,
              };
              // Map by step name or action
              if (entry.step) {
                const stepLower = entry.step.toLowerCase();
                for (const s of STATUS_FLOW) {
                  if (s.label.toLowerCase().includes(stepLower.split(":")[0].trim().slice(0, 6)) ||
                      stepLower.includes(s.key.slice(0, 5))) {
                    statusPerformers[s.key] = entry.by;
                  }
                }
              }
              // Direct action mapping
              if (entry.action === "confirmed") statusPerformers["confirmado"] = entry.by;
              if (entry.action === "approved") statusPerformers["aprobado"] = entry.by;
              if (entry.action === "advanced") statusPerformers[entry.step?.toLowerCase()?.includes("presup") ? "presupuestado" : "en_proceso"] = entry.by;
            }
            // Also set borrador performer from the request creator
            if (r.createdBy) statusPerformers["borrador"] = r.createdBy;
          }

          return (
            <div className="bg-white/[0.03] rounded-xl px-4 py-3.5 border border-white/[0.06]">
              {STATUS_FLOW.map((s, i) => {
                const reached = i <= statusIdx;
                const performer = statusPerformers[s.key];
                return (
                  <div key={s.key} className="flex gap-3">
                    <div className="flex flex-col items-center w-6">
                      <div
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] text-white transition-all duration-300"
                        style={{
                          background: reached ? s.color : 'rgba(255,255,255,0.06)',
                          border: i === statusIdx ? `2px solid ${s.color}` : 'none',
                          boxShadow: i === statusIdx ? `0 0 0 3px ${s.color}20` : 'none',
                        }}
                      >
                        {reached ? "✓" : ""}
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div
                          className="w-0.5 h-[22px]"
                          style={{ background: i < statusIdx ? s.color : 'rgba(255,255,255,0.06)' }}
                        />
                      )}
                    </div>
                    <div className="pb-2 min-w-0">
                      <div
                        className={`text-xs ${reached ? 'font-semibold text-white' : 'font-normal text-slate-400'}`}
                      >
                        {s.icon} {s.label}
                      </div>
                      {reached && performer && (
                        <div className="text-[10px] text-slate-500">por {performer}</div>
                      )}
                      {reached && i === 0 && !performer && (
                        <div className="text-[10px] text-slate-400">{fmtDate(r.date)}</div>
                      )}
                      {reached && i === 0 && performer && (
                        <div className="text-[10px] text-slate-400">{fmtDate(r.date)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {!showTrazabilidad && (r.approvalHistory?.length || 0) === 0 && (
          <div className="text-xs text-slate-400 py-1.5">
            Sin historial de acciones todavía
          </div>
        )}
      </div>

    </>
  );
}
