import { colors, font, radius, shadows } from "../../styles/theme";
import { getStatusDisplay, getStatusProgress, getPriorityDisplay, formatGuaranies } from "../../utils/statusHelpers";
import { getSectors } from "../../constants/parameters";

export default function RequestCard({ request: r, onClick }) {
  const status = getStatusDisplay(r.status);
  const priority = getPriorityDisplay(r.priority || r.urgency);
  const progress = getStatusProgress(r.status);

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.card,
        borderRadius: radius.lg,
        padding: "14px 16px",
        marginBottom: 8,
        border: `1px solid ${colors.border}`,
        cursor: "pointer",
        transition: "all 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = colors.primary + "50";
        e.currentTarget.style.boxShadow = shadows.sm;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Progress bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: colors.borderLight,
      }}>
        <div style={{
          width: `${progress}%`, height: "100%",
          background: status.color,
          transition: "width 0.3s",
        }} />
      </div>

      {/* Top row: ID + Priority */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 6, paddingTop: 2,
      }}>
        <span style={{
          fontSize: 11, color: colors.textMuted, fontWeight: 500,
          fontFamily: font,
        }}>
          {r.id} · {r.date}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: priority.color,
          background: priority.colorLight,
          padding: "2px 8px", borderRadius: radius.full,
        }}>
          {priority.icon} {priority.label}
        </span>
      </div>

      {/* Title */}
      <div style={{
        fontSize: 14, fontWeight: 600, color: colors.text,
        lineHeight: 1.35, marginBottom: 8,
      }}>
        {r.name}
      </div>

      {/* Status + Meta */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{
          fontSize: 11, padding: "3px 8px", borderRadius: radius.sm,
          background: status.colorLight || (status.color + "12"),
          color: status.color, fontWeight: 600,
        }}>
          {status.label}
        </span>
        <span style={{ fontSize: 11, color: colors.textLight }}>
          {r.establishment}
        </span>
        {r.sector && (
          <span style={{ fontSize: 11, color: colors.textMuted }}>
            · {getSectors().find(s => s.name === r.sector)?.icon || ""} {r.sector}
          </span>
        )}
        {r.totalAmount > 0 && (
          <span style={{
            fontSize: 12, fontWeight: 600, color: colors.text,
            marginLeft: "auto", fontFamily: font,
          }}>
            {formatGuaranies(r.totalAmount)}
          </span>
        )}
      </div>

      {/* Requester */}
      {r.requester && (
        <div style={{
          marginTop: 8, fontSize: 11, color: colors.textMuted,
          display: "flex", alignItems: "center", gap: 6,
          paddingTop: 8, borderTop: `1px solid ${colors.borderLight}`,
        }}>
          <span style={{
            width: 18, height: 18, borderRadius: radius.full,
            background: colors.primaryLight, color: colors.primary,
            fontSize: 9, fontWeight: 600, display: "inline-flex",
            alignItems: "center", justifyContent: "center",
          }}>
            {r.requester.charAt(0)}
          </span>
          <span style={{ fontWeight: 500, color: colors.textSecondary }}>{r.requester}</span>
          {r.assignee && (
            <>
              <svg width="12" height="12" viewBox="0 0 20 20" fill={colors.textMuted}>
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
              <span>{r.assignee}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
