// ============================================================
// YPOTI — Approval Flow Visual (Dots + líneas)
// Ref: Precoro approval flow dots en PR detail
// ============================================================
import { colors, shadows, radius } from "../../styles/theme";
import { STEP_STATUS } from "../../constants/approvalConfig";
import { fmtDateTime } from "../../utils/dateFormatters";

const STEP_COLORS = {
  [STEP_STATUS.APPROVED]: colors.success,
  [STEP_STATUS.REJECTED]: colors.danger,
  [STEP_STATUS.REVISION]: colors.warning,
  [STEP_STATUS.PENDING]: "#c8922a",
  [STEP_STATUS.SKIPPED]: "#95a5a6",
};

export default function ApprovalFlow({ steps, style }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div style={{
      background: colors.card, borderRadius: radius.xl, padding: 16,
      border: `1px solid ${colors.borderLight}`,
      boxShadow: shadows.card,
      ...style,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: colors.textLight,
        marginBottom: 14, textTransform: "uppercase", letterSpacing: 1,
      }}>
        Flujo de Autorización y Aprobación
      </div>

      {/* Horizontal dots flow */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between",
        position: "relative",
        padding: "0 4px",
      }}>
        {/* Connecting line behind dots */}
        <div style={{
          position: "absolute",
          top: 15,
          left: 24,
          right: 24,
          height: 3,
          background: colors.border,
          zIndex: 0,
        }}>
          {(() => {
            const approvedCount = steps.filter(s => s.status === STEP_STATUS.APPROVED).length;
            const pct = steps.length > 1 ? (approvedCount / (steps.length - 1)) * 100 : 0;
            return (
              <div style={{
                width: `${Math.min(pct, 100)}%`,
                height: "100%",
                background: colors.success,
                borderRadius: 2,
                transition: "width 0.5s ease",
              }} />
            );
          })()}
        </div>

        {steps.map((step, i) => {
          const isApproved = step.status === STEP_STATUS.APPROVED;
          const isRejected = step.status === STEP_STATUS.REJECTED;
          const isPending = step.status === STEP_STATUS.PENDING;
          const isConditional = step.conditional;
          const dotColor = STEP_COLORS[step.status] || colors.border;

          return (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              flex: 1, minWidth: 0, position: "relative", zIndex: 1,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: isApproved ? dotColor
                  : isRejected ? dotColor
                  : isPending ? "#fff"
                  : colors.surface,
                border: `3px solid ${dotColor}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: isApproved || isRejected ? "#fff" : dotColor,
                boxShadow: isPending ? `0 0 0 4px ${dotColor}20` : "none",
                transition: "all 0.3s",
                animation: isPending ? "pulse 2s infinite" : "none",
              }}>
                {isApproved ? "✓" : isRejected ? "✕" : isConditional ? "!" : (i + 1)}
              </div>

              <div style={{
                fontSize: 11, fontWeight: 600, color: colors.text,
                textAlign: "center", marginTop: 6, lineHeight: 1.2,
                maxWidth: 90, wordBreak: "break-word",
              }}>
                {step.label}
              </div>

              <div style={{
                fontSize: 10, color: colors.textLight,
                textAlign: "center", marginTop: 2,
                maxWidth: 90, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {step.approverName}
              </div>

              <div style={{
                fontSize: 9, marginTop: 3, fontWeight: 500,
                color: isApproved ? colors.success : isRejected ? colors.danger : colors.textLight,
                textAlign: "center",
              }}>
                {isApproved && step.approvedAt ? fmtDateTime(step.approvedAt) : ""}
                {isRejected && step.approvedAt ? fmtDateTime(step.approvedAt) : ""}
                {isPending && step.sla ? `SLA: ${step.sla}h` : ""}
              </div>

              {isConditional && (
                <div style={{
                  fontSize: 8, fontWeight: 600,
                  color: colors.warning, background: colors.warningLight,
                  padding: "1px 6px", borderRadius: radius.xs, marginTop: 2,
                }}>
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
