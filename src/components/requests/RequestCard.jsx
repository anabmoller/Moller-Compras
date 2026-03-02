import { getStatusDisplay, getStatusProgress, getPriorityDisplay, formatGuaranies } from "../../utils/statusHelpers";
import { getSectors } from "../../constants/parameters";
import { STEP_STATUS } from "../../constants/approvalConfig";

function getItemNames(r) {
  const items = r.items || [];
  if (items.length === 0) return r.name;
  const names = items.map(i => i.product || i.name || i.nombre).filter(Boolean);
  if (names.length <= 2) return names.join(", ");
  return names.slice(0, 2).join(", ") + ` + ${names.length - 2} mas`;
}

export default function RequestCard({ request: r, onClick, usdRate }) {
  const status = getStatusDisplay(r.status);
  const priority = getPriorityDisplay(r.priority || r.urgency);
  const progress = getStatusProgress(r.status);
  const displayName = getItemNames(r);
  const rate = usdRate || 7800;

  return (
    <div
      onClick={onClick}
      className="bg-[#F8F9FB]/[0.03] rounded-xl px-4 py-3.5 mb-2 border border-white/[0.06] cursor-pointer transition-all duration-150 relative overflow-hidden hover:border-[#C8A03A]/30 hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.3)]"
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#F8F9FB]/[0.06]">
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${progress}%`, background: status.color }}
        />
      </div>

      {/* Top row: ID + Priority */}
      <div className="flex justify-between items-center mb-1.5 pt-0.5">
        <span className="text-[11px] text-slate-500 font-medium font-sans">
          {r.id} · {r.date}
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: priority.color, background: priority.colorLight }}
        >
          {priority.icon} {priority.label}
        </span>
      </div>

      {/* Title */}
      <div className="text-sm font-semibold text-white leading-snug mb-2">
        {displayName}
      </div>

      {/* Status + Meta */}
      <div className="flex gap-1.5 items-center flex-wrap">
        <span
          className="text-[11px] px-2 py-[3px] rounded-md font-semibold"
          style={{
            background: status.colorLight || (status.color + "12"),
            color: status.color,
          }}
        >
          {status.label}
        </span>
        <span className="text-[11px] text-slate-400">
          {r.establishment}
        </span>
        {r.sector && (
          <span className="text-[11px] text-slate-500">
            · {getSectors().find(s => s.name === r.sector)?.icon || ""} {r.sector}
          </span>
        )}
        {r.totalAmount > 0 && (
          <span className="text-xs font-semibold text-white ml-auto font-sans">
            {formatGuaranies(r.totalAmount)} <span className="text-slate-500 font-normal">/ USD {Math.round(r.totalAmount / rate).toLocaleString("es-PY")}</span>
          </span>
        )}
      </div>

      {/* Mini approval flow */}
      <MiniApprovalFlow steps={r.approvalSteps} />

      {/* Requester + Assignee */}
      <div className="mt-2 text-[11px] text-slate-500 flex flex-col gap-1 pt-2 border-t border-white/[0.06]">
        {r.requester && (
          <div className="flex items-center gap-1.5">
            <span className="w-[18px] h-[18px] rounded-full bg-[#1F2A44]/10 text-emerald-500 text-[9px] font-semibold inline-flex items-center justify-center">
              {r.requester.charAt(0)}
            </span>
            <span className="font-medium text-slate-300">{r.requester}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 20 20" className="fill-slate-500 flex-shrink-0">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
          </svg>
          <span className="text-slate-400">Asignado: {r.assignee || "Laura Rivas"}</span>
        </div>
      </div>
    </div>
  );
}

function MiniApprovalFlow({ steps }) {
  if (!steps || steps.length === 0) return null;

  const MAX_VISIBLE = 4;
  const visible = steps.slice(0, MAX_VISIBLE);
  const hiddenCount = steps.length - MAX_VISIBLE;
  const currentIdx = steps.findIndex(s => s.status === STEP_STATUS.PENDING);

  return (
    <div className="flex items-center gap-0.5 mt-2 pt-2 border-t border-white/[0.06] overflow-hidden">
      {visible.map((step, i) => {
        const isApproved = step.status === STEP_STATUS.APPROVED || step.status === STEP_STATUS.SKIPPED;
        const isCurrent = i === currentIdx;
        const firstName = (step.approverName || "").split(" ")[0];

        return (
          <div key={i} className="flex items-center min-w-0">
            {i > 0 && (
              <div
                className="w-3 h-px mx-0.5 shrink-0"
                style={{ background: isApproved ? "#22c55e" : "rgba(255,255,255,0.08)" }}
              />
            )}
            <div className="flex items-center gap-1 min-w-0" title={`${step.label}: ${step.approverName}`}>
              <div
                className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{
                  background: isApproved ? "#22c55e" : isCurrent ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.06)",
                  color: isApproved ? "#fff" : isCurrent ? "#eab308" : "#475569",
                  border: isCurrent ? "1.5px solid #eab308" : isApproved ? "1.5px solid #22c55e" : "1.5px solid rgba(255,255,255,0.08)",
                  boxShadow: isCurrent ? "0 0 0 2px rgba(234,179,8,0.1)" : "none",
                }}
              >
                {isApproved ? "✓" : (i + 1)}
              </div>
              <span
                className="text-[9px] font-medium truncate max-w-[50px]"
                style={{ color: isApproved ? "#22c55e" : isCurrent ? "#eab308" : "#64748b" }}
              >
                {firstName}
              </span>
            </div>
          </div>
        );
      })}
      {hiddenCount > 0 && (
        <span className="text-[9px] text-slate-500 ml-1 shrink-0">+{hiddenCount}</span>
      )}
    </div>
  );
}
