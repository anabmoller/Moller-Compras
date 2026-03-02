// ============================================================
// YPOTI — Approval Flow Visual (Dots + líneas)
// Ref: Precoro approval flow dots en PR detail
// ============================================================
import { STEP_STATUS } from "../../constants/approvalConfig";
import { fmtDateTime } from "../../utils/dateFormatters";

const STEP_COLORS = {
  [STEP_STATUS.APPROVED]: "#22c55e",
  [STEP_STATUS.REJECTED]: "#ef4444",
  [STEP_STATUS.REVISION]: "#f59e0b",
  [STEP_STATUS.PENDING]: "#c8922a",
  [STEP_STATUS.SKIPPED]: "#95a5a6",
};

export default function ApprovalFlow({ steps, style }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div
      className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
      style={style}
    >
      <div className="text-xs font-semibold text-slate-400 mb-3.5 uppercase tracking-wide">
        Flujo de Autorización y Aprobación
      </div>

      {/* Horizontal dots flow */}
      <div className="flex items-start justify-between relative px-1">
        {/* Connecting line behind dots */}
        <div className="absolute top-[15px] left-6 right-6 h-[3px] bg-white/[0.06] z-0">
          {(() => {
            const approvedCount = steps.filter(s => s.status === STEP_STATUS.APPROVED).length;
            const pct = steps.length > 1 ? (approvedCount / (steps.length - 1)) * 100 : 0;
            return (
              <div
                className="h-full bg-[#C8A03A] rounded-sm transition-all duration-500"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            );
          })()}
        </div>

        {steps.map((step, i) => {
          const isApproved = step.status === STEP_STATUS.APPROVED;
          const isRejected = step.status === STEP_STATUS.REJECTED;
          const isPending = step.status === STEP_STATUS.PENDING;
          const isConditional = step.conditional;
          const dotColor = STEP_COLORS[step.status] || 'rgba(255,255,255,0.06)';

          return (
            <div key={i} className="flex flex-col items-center flex-1 min-w-0 relative z-[1]">
              <div
                className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-sm transition-all duration-300 ${isPending ? 'animate-pulse' : ''}`}
                style={{
                  background: isApproved ? dotColor
                    : isRejected ? dotColor
                    : isPending ? '#fff'
                    : 'rgba(255,255,255,0.02)',
                  border: `3px solid ${dotColor}`,
                  color: isApproved || isRejected ? '#fff' : dotColor,
                  boxShadow: isPending ? `0 0 0 4px ${dotColor}20` : 'none',
                }}
              >
                {isApproved ? "✓" : isRejected ? "✕" : isConditional ? "!" : (i + 1)}
              </div>

              <div className="text-[11px] font-semibold text-white text-center mt-1.5 leading-tight max-w-[90px] break-words">
                {step.label}
              </div>

              <div className="text-[10px] text-slate-400 text-center mt-0.5 max-w-[90px] overflow-hidden text-ellipsis whitespace-nowrap">
                {step.approverName}
              </div>

              <div
                className="text-[9px] mt-0.5 font-medium text-center"
                style={{
                  color: isApproved ? '#22c55e' : isRejected ? '#ef4444' : '#94a3b8',
                }}
              >
                {isApproved && step.approvedAt ? fmtDateTime(step.approvedAt) : ""}
                {isRejected && step.approvedAt ? fmtDateTime(step.approvedAt) : ""}
                {isPending && step.sla ? `SLA: ${step.sla}h` : ""}
              </div>

              {isConditional && (
                <div className="text-[8px] font-semibold text-amber-400 bg-amber-400/[0.06] px-1.5 py-px rounded mt-0.5">
                  CONDICIONAL
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
