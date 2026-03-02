import { getBudgetPercent, getBudgetRemaining, formatGuaranies } from "../../constants/budgets";

const barColor = (pct) => pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';

export default function BudgetGroupList({ grouped, filterEst, onEdit }) {
  return (
    <div className="px-5">
      {Object.entries(grouped).map(([est, items]) => {
        const estTotal = items.reduce((s, b) => s + b.planned, 0);
        const estConsumed = items.reduce((s, b) => s + b.consumed, 0);
        const estPct = estTotal > 0 ? Math.round((estConsumed / estTotal) * 100) : 0;
        return (
          <div key={est} className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <div className="text-[13px] font-bold text-white uppercase tracking-wide">
                {"📍"} {est}
              </div>
              <div className="text-[11px] font-semibold" style={{ color: barColor(estPct) }}>
                {formatGuaranies(estConsumed)} / {formatGuaranies(estTotal)} ({estPct}%)
              </div>
            </div>

            {items.map(b => {
              const pct = getBudgetPercent(b);
              const remaining = getBudgetRemaining(b);
              return (
                <div
                  key={b.id}
                  onClick={() => onEdit(b)}
                  className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] mb-2 cursor-pointer transition-all duration-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <div className="text-[13px] font-semibold text-white">
                        {b.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-px">
                        {b.sector} &middot; {b.period}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: barColor(pct) }}>
                        {pct}%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatGuaranies(remaining)} libre
                      </div>
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div className="bg-[#0B1120] rounded h-[5px] overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{ width: `${Math.min(pct, 100)}%`, background: barColor(pct) }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{formatGuaranies(b.consumed)}</span>
                    <span>{formatGuaranies(b.planned)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {Object.keys(grouped).length === 0 && (
        <div className="text-center p-10 text-slate-400 text-[13px]">
          No hay presupuestos activos
          {filterEst !== "all" ? ` para ${filterEst}` : ""}
        </div>
      )}
    </div>
  );
}
