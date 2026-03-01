import { useState, useRef, useMemo } from "react";
import { FULL_SUPPLIER_CATALOG } from "../../constants/catalogs";

// ---- Supplier autocomplete hook ----
function useSupplierSearch(query) {
  return useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return FULL_SUPPLIER_CATALOG
      .filter(s => s.n.toLowerCase().includes(q) || (s.r && s.r.includes(q)))
      .slice(0, 8);
  }, [query]);
}

// ---- File to base64 ----
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50";
const labelCls = "block text-xs font-medium text-slate-400 mb-1.5 tracking-wide";

export default function QuotationAddForm({ items, currency: initCurrency, onAdd, onCancel }) {
  const [supplier, setSupplier] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currency, setCurrency] = useState(initCurrency || "PYG");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState(null);
  const fileRef = useRef(null);

  const [itemPrices, setItemPrices] = useState(() => {
    const init = {};
    items.forEach((_, i) => { init[i] = ""; });
    return init;
  });

  const suggestions = useSupplierSearch(supplier);

  const setItemPrice = (idx, val) => {
    setItemPrices(prev => ({ ...prev, [idx]: val }));
  };

  const calcTotal = () => {
    return items.reduce((sum, it, idx) => {
      const qty = it.quantity || it.cantidad || 0;
      const price = parseFloat(itemPrices[idx]) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const formTotal = calcTotal();
  const formValid = supplier.trim().length > 0 && formTotal > 0;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Archivo demasiado grande (max 5MB)");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      alert("Solo se permiten imagenes (JPG, PNG, WebP) o PDF");
      return;
    }
    try {
      const data = await fileToBase64(file);
      setAttachment({ name: file.name, type: file.type, data });
    } catch {
      alert("Error al leer archivo");
    }
  };

  const handleAdd = () => {
    if (!formValid) return;
    const days = Math.max(0, Math.min(9999, parseInt(deliveryDays) || 0));

    const itemBreakdown = items.map((it, idx) => ({
      name: it.name || it.nombre || "Item",
      code: it.codigo || it.code || "",
      quantity: it.quantity || it.cantidad || 0,
      unit: it.unit || it.unidad || "un",
      unitPrice: parseFloat(itemPrices[idx]) || 0,
      subtotal: (it.quantity || it.cantidad || 0) * (parseFloat(itemPrices[idx]) || 0),
    }));

    onAdd({
      supplier: supplier.trim().slice(0, 200),
      currency,
      price: formTotal,
      items: itemBreakdown,
      deliveryDays: days,
      paymentTerms: (paymentTerms || "").trim().slice(0, 500),
      notes: (notes || "").trim().slice(0, 1000),
      attachment: attachment || null,
    });
  };

  return (
    <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/[0.06] mt-2">
      <div className="text-[13px] font-semibold text-white mb-3">Nueva Cotizacion</div>

      <div className="flex flex-col gap-2.5">
        {/* Supplier with autocomplete */}
        <div className="relative">
          <label className={labelCls}>Proveedor</label>
          <input
            value={supplier}
            onChange={e => { setSupplier(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Buscar proveedor..."
            className={inputCls}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1b23] border border-white/[0.1] rounded-lg shadow-xl z-50 max-h-[180px] overflow-auto">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="px-3 py-2 cursor-pointer hover:bg-white/[0.06] border-b border-white/[0.04] last:border-0"
                  onMouseDown={() => {
                    setSupplier(s.n);
                    setShowSuggestions(false);
                  }}
                >
                  <div className="text-xs text-white font-medium">{s.n}</div>
                  <div className="text-[10px] text-slate-400">RUC: {s.r} · {s.c} compra{s.c !== 1 ? "s" : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currency + Delivery */}
        <div className="flex gap-2">
          <div className="w-[100px]">
            <label className={labelCls}>Moneda</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls}>
              <option value="PYG">PYG</option>
              <option value="USD">USD</option>
              <option value="BRL">BRL</option>
            </select>
          </div>
          <div className="flex-1">
            <label className={labelCls}>Plazo entrega (dias)</label>
            <input
              type="number"
              value={deliveryDays}
              onChange={e => setDeliveryDays(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
        </div>

        {/* Per-item pricing table */}
        <div>
          <label className={labelCls}>Precios por Item</label>
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
            {items.length > 0 ? items.map((it, idx) => (
              <div key={idx} className={`flex items-center gap-2 px-3 py-2 ${idx < items.length - 1 ? 'border-b border-white/[0.06]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white font-medium truncate">{it.name || it.nombre || "Item"}</div>
                  <div className="text-[10px] text-slate-400">
                    {it.quantity || it.cantidad || 0} {it.unit || it.unidad || "un"}
                    {(it.codigo || it.code) && ` · ${it.codigo || it.code}`}
                  </div>
                </div>
                <div className="w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    value={itemPrices[idx] || ""}
                    onChange={e => setItemPrice(idx, e.target.value)}
                    placeholder="P. Unit."
                    className="w-full px-2.5 py-1.5 rounded-md border border-white/[0.1] bg-white/[0.05] text-xs text-white outline-none focus:border-emerald-500/50 text-right"
                  />
                </div>
                {parseFloat(itemPrices[idx]) > 0 && (
                  <div className="text-[10px] text-emerald-400 font-semibold w-[70px] text-right flex-shrink-0">
                    {((it.quantity || it.cantidad || 0) * parseFloat(itemPrices[idx])).toLocaleString()}
                  </div>
                )}
                {/* R7: Price deviation warning vs catalog average */}
                {(() => {
                  const entered = parseFloat(itemPrices[idx]);
                  const avg = it._catalogRef?.ap || it.ap || 0;
                  if (!entered || !avg) return null;
                  const pct = ((entered - avg) / avg) * 100;
                  if (pct > 5) return (
                    <div className="w-full text-[10px] text-amber-400 font-medium px-3 pb-1">
                      ⚠ Precio {pct.toFixed(0)}% sobre promedio catálogo ({avg.toLocaleString()})
                    </div>
                  );
                  return null;
                })()}
              </div>
            )) : (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">Sin items en la solicitud</div>
            )}
            {/* Total */}
            {formTotal > 0 && (
              <div className="px-3 py-2 bg-white/[0.02] border-t border-white/[0.06] flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-400">TOTAL</span>
                <span className="text-sm font-bold text-emerald-400">
                  {currency} {formTotal.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment terms */}
        <div>
          <label className={labelCls}>Condiciones de pago</label>
          <input
            value={paymentTerms}
            onChange={e => setPaymentTerms(e.target.value)}
            placeholder="Ej: 30 dias, contado, cheque"
            className={inputCls}
          />
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Observaciones</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notas adicionales..."
            rows={2}
            className={`${inputCls} resize-y`}
          />
        </div>

        {/* File upload */}
        <div>
          <label className={labelCls}>Adjuntar cotizacion (imagen/PDF)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          {attachment ? (
            <div className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]">
              {attachment.type.startsWith("image/") ? (
                <img src={attachment.data} alt="" className="w-10 h-10 object-cover rounded" />
              ) : (
                <div className="w-10 h-10 bg-red-500/[0.08] rounded flex items-center justify-center text-lg">{"📄"}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white truncate">{attachment.name}</div>
                <div className="text-[10px] text-slate-400">{attachment.type.startsWith("image/") ? "Imagen" : "PDF"}</div>
              </div>
              <button
                onClick={() => setAttachment(null)}
                className="bg-transparent border-none text-red-400 text-xs cursor-pointer p-1"
              >
                &#10005;
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-2.5 rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] text-xs text-slate-400 cursor-pointer"
            >
              {"📎"} Seleccionar archivo
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white text-[13px] font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={!formValid}
            className={`flex-1 py-3 rounded-xl border-none text-[13px] font-semibold ${
              formValid
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white cursor-pointer'
                : 'bg-white/[0.06] text-slate-500 cursor-default'
            }`}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
