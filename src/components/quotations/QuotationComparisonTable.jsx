export default function QuotationComparisonTable({
  quotations, items, bestItemPrices, cheapest, fastest,
}) {
  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-auto mb-3">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left px-3 py-2.5 text-slate-400 font-semibold sticky left-0 bg-[#0a0b0f] min-w-[100px]">Item</th>
            {quotations.map(q => (
              <th key={q.id} className="text-center px-3 py-2.5 text-white font-semibold min-w-[90px]">
                <div className="truncate max-w-[90px]">{q.supplier}</div>
                <div className="text-[10px] text-slate-400 font-normal">{q.currency}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx} className="border-b border-white/[0.06]">
              <td className="px-3 py-2 text-white sticky left-0 bg-[#0a0b0f]">
                <div className="font-medium truncate max-w-[100px]">{it.name || it.nombre || "Item"}</div>
                <div className="text-[10px] text-slate-400">{it.quantity || it.cantidad || 0} {it.unit || it.unidad || "un"}</div>
              </td>
              {quotations.map(q => {
                const itemData = q.items?.[idx];
                const price = itemData?.unitPrice || 0;
                const isBest = price > 0 && bestItemPrices[idx] === price;
                return (
                  <td key={q.id} className={`px-3 py-2 text-center font-semibold ${isBest ? 'text-[#C8A03A] bg-[#C8A03A]/[0.04]' : 'text-white'}`}>
                    {price > 0 ? price.toLocaleString() : "—"}
                    {price > 0 && (
                      <div className="text-[10px] text-slate-400 font-normal">
                        = {(price * (it.quantity || it.cantidad || 0)).toLocaleString()}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {/* Total row */}
          <tr className="bg-white/[0.02]">
            <td className="px-3 py-2.5 text-white font-bold sticky left-0 bg-[#0a0b0f]">TOTAL</td>
            {quotations.map(q => {
              const isCheapest = q.id === cheapest?.id;
              return (
                <td key={q.id} className={`px-3 py-2.5 text-center font-bold text-sm ${isCheapest ? 'text-[#C8A03A]' : 'text-white'}`}>
                  {q.price?.toLocaleString()}
                </td>
              );
            })}
          </tr>
          {/* Delivery row */}
          <tr>
            <td className="px-3 py-2 text-slate-400 sticky left-0 bg-[#0a0b0f]">Entrega</td>
            {quotations.map(q => {
              const isFastest = q.id === fastest?.id;
              return (
                <td key={q.id} className={`px-3 py-2 text-center ${isFastest ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                  {q.deliveryDays > 0 ? `${q.deliveryDays}d` : "—"}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
