// ============================================================
// YPOTI — Budget Widget (sidebar del detalle de PR)
// Módulo 10 — Muestra presupuesto consumido vs. planificado
// ============================================================
import { findBudgetForPR, getBudgetPercent, getBudgetRemaining, formatGuaranies } from "../../constants/budgets";

export default function BudgetWidget({ establishment, sector, requestAmount, style }) {
  const budget = findBudgetForPR(establishment, sector);

  if (!budget) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-3.5 border border-white/[0.06]" style={style}>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
          Presupuesto
        </div>
        <div className="text-xs text-slate-400">
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

  const barColor = percent >= 90 ? '#ef4444'
    : percent >= 70 ? '#f59e0b'
    : '#22c55e';

  const newBarColor = wouldExceed ? '#ef4444'
    : newPercent >= 90 ? '#f59e0b'
    : barColor;

  return (
    <div
      className="bg-white/[0.03] rounded-xl p-3.5 shadow-sm"
      style={{
        border: `1px solid ${wouldExceed ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`,
        ...style,
      }}
    >
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
        Presupuesto
      </div>

      <div className="text-[13px] font-semibold text-white mb-2.5 leading-tight">
        {budget.name}
        <span className="text-[11px] font-normal text-slate-400 block">
          {budget.period}
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-[#0a0b0f] rounded h-2.5 overflow-hidden mb-2 border border-white/[0.06]">
        <div
          className="h-full rounded transition-all duration-500 relative"
          style={{ width: `${Math.min(percent, 100)}%`, background: barColor }}
        >
          {requestAmount > 0 && (
            <div
              className="absolute right-0 top-0 h-full rounded-r"
              style={{
                width: `${Math.min(((requestAmount) / budget.planned) * 100, 100 - percent)}%`,
                background: newBarColor + "60",
                minWidth: requestAmount > 0 ? 3 : 0,
              }}
            />
          )}
        </div>
      </div>

      {/* Numbers */}
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>
          <span className="font-semibold" style={{ color: barColor }}>
            {formatGuaranies(budget.consumed)}
          </span>
          {" consumido"}
        </span>
        <span>{percent}%</span>
      </div>

      <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
        <span>{formatGuaranies(remaining)} restante</span>
        <span>{formatGuaranies(budget.planned)} planificado</span>
      </div>

      {/* Exceeds warning */}
      {wouldExceed && (
        <div className="mt-2.5 px-2.5 py-2 rounded-lg bg-red-500/[0.06] border border-red-500/[0.12] flex items-center gap-2">
          <span className="text-base">⚠</span>
          <div>
            <div className="text-[11px] font-semibold text-red-300">
              Excede el presupuesto
            </div>
            <div className="text-[10px] text-red-400">
              Esta solicitud ({formatGuaranies(requestAmount)}) supera el saldo disponible.
              Se requerirá aprobación overbudget.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
