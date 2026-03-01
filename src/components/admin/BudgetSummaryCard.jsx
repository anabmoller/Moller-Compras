import { formatGuaranies } from "../../constants/budgets";

const barColor = (pct) => pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';

export default function BudgetSummaryCard({ totalPlanned, totalConsumed, totalPercent }) {
  return (
    <div className="px-5 mb-4">
      <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] shadow-sm">
        <div className="flex justify-between mb-2.5">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Total General
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              {formatGuaranies(totalPlanned)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Consumido
            </div>
            <div className="text-lg font-bold mt-0.5" style={{ color: barColor(totalPercent) }}>
              {totalPercent}%
            </div>
          </div>
        </div>
        <div className="bg-[#0a0b0f] rounded h-2 overflow-hidden border border-white/[0.06]">
          <div
            className="h-full rounded transition-all duration-500"
            style={{ width: `${Math.min(totalPercent, 100)}%`, background: barColor(totalPercent) }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
          <span>{formatGuaranies(totalConsumed)} consumido</span>
          <span>{formatGuaranies(totalPlanned - totalConsumed)} restante</span>
        </div>
      </div>
    </div>
  );
}
