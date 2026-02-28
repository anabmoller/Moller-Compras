// ============================================================
// YPOTI — Budget Widget (sidebar del detalle de PR)
// Módulo 10 — Muestra presupuesto consumido vs. planificado
// ============================================================
import { colors, shadows, radius } from "../../styles/theme";
import { findBudgetForPR, getBudgetPercent, getBudgetRemaining, formatGuaranies } from "../../constants/budgets";

export default function BudgetWidget({ establishment, sector, requestAmount, style }) {
  const budget = findBudgetForPR(establishment, sector);

  if (!budget) {
    return (
      <div style={{
        background: colors.surface, borderRadius: radius.lg, padding: 14,
        border: `1px solid ${colors.borderLight}`,
        ...style,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: colors.textLight,
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 6,
        }}>
          Presupuesto
        </div>
        <div style={{ fontSize: 12, color: colors.textLight }}>
          Sin presupuesto asignado para {establishment} / {sector || "—"}
        </div>
      </div>
    );
  }

  const percent = getBudgetPercent(budget);
  const remaining = getBudgetRemaining(budget);
  const wouldExceed = requestAmount ? (budget.consumed + requestAmount) > budget.planned : false;
  const newPercent = requestAmount
    ? Math.round(((budget.consumed + requestAmount) / budget.planned) * 100)
    : percent;

  const barColor = percent >= 90 ? colors.danger
    : percent >= 70 ? colors.warning
    : colors.success;

  const newBarColor = wouldExceed ? colors.danger
    : newPercent >= 90 ? colors.warning
    : barColor;

  return (
    <div style={{
      background: colors.card, borderRadius: radius.lg, padding: 14,
      border: `1px solid ${wouldExceed ? colors.danger + "40" : colors.borderLight}`,
      boxShadow: shadows.card,
      ...style,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: colors.textLight,
        textTransform: "uppercase", letterSpacing: 1, marginBottom: 4,
      }}>
        Presupuesto
      </div>

      <div style={{
        fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10,
        lineHeight: 1.3,
      }}>
        {budget.name}
        <span style={{ fontSize: 11, fontWeight: 400, color: colors.textLight, display: "block" }}>
          {budget.period}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        background: colors.bg, borderRadius: radius.sm, height: 10,
        overflow: "hidden", marginBottom: 8,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{
          height: "100%",
          width: `${Math.min(percent, 100)}%`,
          background: barColor,
          borderRadius: radius.sm,
          transition: "width 0.5s ease",
          position: "relative",
        }}>
          {requestAmount > 0 && (
            <div style={{
              position: "absolute", right: 0, top: 0,
              height: "100%",
              width: `${Math.min(((requestAmount) / budget.planned) * 100, 100 - percent)}%`,
              background: newBarColor + "60",
              borderRadius: `0 ${radius.sm}px ${radius.sm}px 0`,
              minWidth: requestAmount > 0 ? 3 : 0,
            }} />
          )}
        </div>
      </div>

      {/* Numbers */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 11, color: colors.textLight,
      }}>
        <span>
          <span style={{ fontWeight: 600, color: barColor }}>
            {formatGuaranies(budget.consumed)}
          </span>
          {" consumido"}
        </span>
        <span>{percent}%</span>
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 11, color: colors.textLight, marginTop: 2,
      }}>
        <span>{formatGuaranies(remaining)} restante</span>
        <span>{formatGuaranies(budget.planned)} planificado</span>
      </div>

      {/* Exceeds warning */}
      {wouldExceed && (
        <div style={{
          marginTop: 10, padding: "8px 10px", borderRadius: radius.md,
          background: colors.dangerLight, border: `1px solid ${colors.danger}20`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#991b1b" }}>
              Excede el presupuesto
            </div>
            <div style={{ fontSize: 10, color: "#b91c1c" }}>
              Esta solicitud ({formatGuaranies(requestAmount)}) supera el saldo disponible.
              Se requerirá aprobación overbudget.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
