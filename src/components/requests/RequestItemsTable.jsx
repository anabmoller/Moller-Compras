// ============================================================
// RequestItemsTable — Items list with pricing, totals, add/remove
// Extracted from RequestDetail.jsx
// ============================================================
import { formatGuaranies } from "../../constants/budgets";

function SectionTitle({ children, count }) {
  return (
    <div className="flex items-center justify-between mb-3 cursor-default">
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

export default function RequestItemsTable({
  items,
  itemsTotal,
  displayTotal,
  rate,
  isBorrador,
  onRemoveItem,
  onShowAddItem,
}) {
  return (
    <div className="px-5 py-2">
      <SectionTitle count={items.length}>Items</SectionTitle>
      {items.length > 0 ? (
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden shadow-sm">
          {items.map((it, idx) => (
            <div
              key={idx}
              className={`px-4 py-3 flex justify-between items-start ${idx < items.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 bg-[#0a0b0f] px-1.5 py-0.5 rounded">
                    {idx + 1}
                  </span>
                  {(it.codigo || it.code) && (
                    <span className="text-[10px] text-emerald-400 font-semibold">{it.codigo || it.code}</span>
                  )}
                </div>
                <div className="text-[13px] font-semibold text-white mt-0.5">
                  {it.name || it.nombre || "Item"}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {it.quantity || it.cantidad || 0} {it.unit || it.unidad || "un"} × {formatGuaranies(it.unitPrice || it.precioUnitario || 0)}
                </div>
                {(it.proveedor || it.supplier) && (
                  <div className="text-[10px] text-slate-400 mt-px">
                    Prov: {it.proveedor || it.supplier}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[13px] font-bold text-white">
                  {formatGuaranies((it.unitPrice || it.precioUnitario || 0) * (it.quantity || it.cantidad || 0))}
                </div>
                <div className="text-[10px] text-slate-500">
                  USD {Math.round(((it.unitPrice || it.precioUnitario || 0) * (it.quantity || it.cantidad || 0)) / rate).toLocaleString("es-PY")}
                </div>
                {isBorrador && (
                  <button
                    onClick={() => onRemoveItem(idx)}
                    className="bg-transparent border-none text-sm cursor-pointer p-1 text-red-400 mt-0.5"
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
          {/* Total footer */}
          <div className="px-4 py-2.5 bg-white/[0.02] border-t border-white/[0.06]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400">
                TOTAL ({items.length} item{items.length !== 1 ? "s" : ""})
              </span>
              <div className="text-right">
                <span className="text-[15px] font-bold text-emerald-400">
                  {formatGuaranies(itemsTotal || displayTotal)}
                </span>
                <div className="text-[11px] text-slate-500">
                  USD {Math.round((itemsTotal || displayTotal) / rate).toLocaleString("es-PY")}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-600 mt-1 text-right">
              TC: 1 USD = Gs {Number(rate).toLocaleString("es-PY")}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.06] text-center">
          <div className="text-[13px] text-slate-400">Sin items registrados</div>
          {displayTotal > 0 && (
            <div className="text-sm font-semibold text-emerald-400 mt-1.5">
              Monto estimado: {formatGuaranies(displayTotal)}
              <span className="text-slate-500 font-normal text-xs ml-1">
                / USD {Math.round(displayTotal / rate).toLocaleString("es-PY")}
              </span>
            </div>
          )}
        </div>
      )}
      {/* Add item button (borrador only) */}
      {isBorrador && (
        <button
          onClick={onShowAddItem}
          className="w-full p-3 rounded-xl mt-2 border border-dashed border-emerald-500/25 bg-emerald-500/[0.04] text-emerald-400 text-xs font-semibold cursor-pointer"
        >
          + Agregar Item
        </button>
      )}
    </div>
  );
}
