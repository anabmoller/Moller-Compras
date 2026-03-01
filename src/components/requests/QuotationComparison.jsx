// ============================================================
// QuotationComparison — Quotation listing + comparison table
// Extracted from RequestDetail.jsx
// ============================================================

function SectionTitle({ children, count }) {
  return (
    <div className="flex items-center justify-between cursor-default">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
        {children}
        {count != null && (
          <span className="bg-emerald-500/[0.08] text-emerald-400 text-[10px] font-bold px-1.5 py-px rounded-md min-w-[18px] text-center">
            {count}
          </span>
        )}
      </div>
    </div>
  );
}

export default function QuotationComparison({
  request: r,
  normalizedStatus,
  quotationCount,
  showQuotationBtn,
  canManageQuotations,
  rate,
  onShowQuotations,
}) {
  return (
    <>
      {/* ===== QUOTATIONS ===== */}
      {(showQuotationBtn || quotationCount > 0) && (
        <div className="px-5 py-2">
          <div
            className="rounded-xl p-4"
            style={{
              background: normalizedStatus === "en_cotizacion" ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${normalizedStatus === "en_cotizacion" ? 'rgba(16,185,129,0.19)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div className={`flex justify-between items-center ${quotationCount > 0 ? 'mb-2.5' : ''}`}>
              <SectionTitle count={quotationCount}>Cotizaciones</SectionTitle>
              {canManageQuotations && (
                <button
                  onClick={onShowQuotations}
                  className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-lg px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer"
                >
                  {quotationCount > 0 ? "Ver / Editar" : "+ Agregar"}
                </button>
              )}
            </div>
            {quotationCount > 0 && (
              <div className="flex flex-col gap-1.5">
                {r.quotations.slice(0, 3).map(q => (
                  <div
                    key={q.id}
                    className="flex justify-between rounded-lg px-2.5 py-2"
                    style={{
                      background: q.selected ? 'rgba(34,197,94,0.06)' : 'rgba(10,11,15,1)',
                      border: q.selected ? '1px solid rgba(34,197,94,0.19)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className={`text-xs text-white ${q.selected ? 'font-semibold' : 'font-normal'}`}>
                      {q.selected && "✓ "}{q.supplier}
                    </span>
                    <span className={`text-xs font-semibold ${q.selected ? 'text-green-400' : 'text-white'}`}>
                      {q.currency} {q.price?.toLocaleString()}
                    </span>
                  </div>
                ))}
                {quotationCount > 3 && (
                  <div className="text-[11px] text-slate-400 text-center">
                    +{quotationCount - 3} mas...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== QUOTATION COMPARISON SUMMARY ===== */}
      {quotationCount >= 2 && (() => {
        // Normalize prices to PYG for comparison (USD/BRL → PYG using rate)
        const normalizeToPYG = (q) => {
          const p = q.price || 0;
          if (p <= 0) return 0;
          const cur = (q.currency || "₲").toUpperCase();
          if (cur === "USD" || cur === "US$") return p * rate;
          if (cur === "BRL" || cur === "R$") return p * (rate / 5.5);
          return p; // PYG / ₲ / Gs
        };
        // Filter out quotations with no valid price
        const validQuots = r.quotations.filter(q => (q.price || 0) > 0);
        if (validQuots.length < 2) return null;
        const sorted = [...validQuots].sort((a, b) => normalizeToPYG(a) - normalizeToPYG(b));
        const cheapest = sorted[0];
        const mostExpensive = sorted[sorted.length - 1];
        const cheapestNorm = normalizeToPYG(cheapest);
        const expensiveNorm = normalizeToPYG(mostExpensive);
        const savings = expensiveNorm > 0
          ? Math.round(((expensiveNorm - cheapestNorm) / expensiveNorm) * 100)
          : 0;
        return (
          <div className="px-5 py-2">
            <SectionTitle>Comparativo de Cotizaciones</SectionTitle>
            <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden mt-3">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Proveedor</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase text-right">Precio</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase text-right w-16">Entrega</span>
              </div>
              {/* Table rows */}
              {sorted.map((q, i) => {
                const isBest = i === 0;
                return (
                  <div
                    key={q.id}
                    className={`grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2.5 items-center ${
                      i < sorted.length - 1 ? 'border-b border-white/[0.06]' : ''
                    } ${isBest ? 'bg-emerald-500/[0.04]' : ''}`}
                  >
                    <span className="text-xs text-white font-medium flex items-center gap-1.5 truncate">
                      {isBest && <span className="text-amber-400 text-sm">★</span>}
                      {q.supplier}
                      {q.selected && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-px rounded font-bold">SEL</span>}
                    </span>
                    <span className={`text-xs font-semibold text-right whitespace-nowrap ${isBest ? 'text-emerald-400' : 'text-white'}`}>
                      {q.currency || "₲"} {(q.price || 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 text-right w-16">
                      {q.deliveryDays ? `${q.deliveryDays}d` : "—"}
                    </span>
                  </div>
                );
              })}
              {/* Recommendation footer */}
              <div className="px-4 py-2.5 border-t border-white/[0.06] bg-emerald-500/[0.03] flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 font-semibold">
                  ★ Recomendado: {cheapest.supplier}
                </span>
                {savings > 0 && (
                  <span className="text-[10px] text-emerald-400/70 font-medium">
                    {savings}% más económico
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
