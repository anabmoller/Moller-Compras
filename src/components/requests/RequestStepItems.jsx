import { useState, useMemo } from "react";
import { getEstablishments, getSectors } from "../../constants/parameters";

const SECTOR_CATEGORY_MAP = {
  "Agricultura": "Agrícola",
  "Veterinaria": "Veterinaria",
  "Nutrición": "Nutrición",
  "Feedlot": "Nutrición",
  "Mantenimiento": "Operacional",
  "Transporte": "Operacional",
  "Administración": "Mercadería",
};

function autoUnit(code) {
  if (!code) return "unidad";
  if (code.startsWith("AGRO-")) return "tonelada";
  if (code === "MER-000001" || code === "MER-000073" || code === "MER-000049") return "litro";
  return "unidad";
}

function fmtGs(n) {
  if (!n) return "₲ 0";
  return "₲ " + Math.round(n).toLocaleString("es-PY");
}

export default function RequestStepItems({
  form, items, totalAmount, errors, productCatalog,
  usdRate, usdLive,
  onUpdateForm, onSetItems, onSetErrors,
  FieldError,
}) {
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemAmount, setItemAmount] = useState(0);
  const [itemUnitPrice, setItemUnitPrice] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const sectorCategory = SECTOR_CATEGORY_MAP[form.sector] || null;

  const filteredProducts = useMemo(() => {
    if (!productSearch || productSearch.length < 2) return [];
    const q = productSearch.toLowerCase();
    const matches = productCatalog.filter(p =>
      p.n.toLowerCase().includes(q) || p.c.toLowerCase().includes(q)
    );
    // Sort: matching-sector products first
    if (sectorCategory) {
      matches.sort((a, b) => {
        const aMatch = a.g === sectorCategory ? 0 : 1;
        const bMatch = b.g === sectorCategory ? 0 : 1;
        return aMatch - bMatch;
      });
    }
    return matches.slice(0, 12);
  }, [productSearch, productCatalog, sectorCategory]);

  const priceDeviation = useMemo(() => {
    if (!selectedProduct || !itemUnitPrice || !selectedProduct.up) return null;
    const refUp = selectedProduct.up;
    const pct = ((itemUnitPrice - refUp) / refUp) * 100;
    if (pct > 20) return { level: "red", pct: pct.toFixed(0), msg: "Precio unitario supera referencia por más del 20%" };
    if (pct > 5) return { level: "yellow", pct: pct.toFixed(0), msg: "Precio unitario supera referencia por más del 5%" };
    return null;
  }, [selectedProduct, itemUnitPrice]);

  const selectProduct = (p) => {
    setSelectedProduct(p);
    setProductSearch(p.n);
    setShowDropdown(false);
    setItemQty(1);
    const unitPrice = p.up > 0 ? p.up : 0;
    setItemUnitPrice(unitPrice);
    setItemAmount(unitPrice);
  };

  const selectFreeProduct = () => {
    const freeItem = { n: productSearch.trim(), c: "LIBRE", g: "", u: "unidad", up: 0, lp: 0, ap: 0, ld: "", ls: "", _isFree: true };
    setSelectedProduct(freeItem);
    setShowDropdown(false);
    setItemQty(1);
    setItemUnitPrice(0);
    setItemAmount(0);
  };

  const addItem = () => {
    if (!selectedProduct) return;
    if (itemQty <= 0) { onSetErrors({ itemQty: "Debe ser > 0" }); return; }
    onSetItems(prev => [...prev, {
      product: selectedProduct.n,
      code: selectedProduct._isFree ? "" : selectedProduct.c,
      qty: itemQty,
      unit: selectedProduct._isFree ? "unidad" : autoUnit(selectedProduct.c),
      estimatedAmount: itemAmount || 0,
      _catalogRef: selectedProduct._isFree ? null : selectedProduct,
      isFreeItem: selectedProduct._isFree || false,
    }]);
    setSelectedProduct(null);
    setProductSearch("");
    setItemQty(1);
    setItemAmount(0);
    onSetErrors({});
  };

  const removeItem = (idx) => {
    onSetItems(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Establishment + Sector */}
      <div className="flex gap-2.5">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Establecimiento *</label>
          <select
            value={form.establishment}
            onChange={e => onUpdateForm("establishment", e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 ${errors.establishment ? 'border-red-500' : 'border-white/[0.1]'}`}
          >
            <option value="">Seleccionar...</option>
            {getEstablishments().filter(e => e.active).map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
          </select>
          <FieldError field="establishment" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Sector *</label>
          <select
            value={form.sector}
            onChange={e => onUpdateForm("sector", e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-lg border bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 ${errors.sector ? 'border-red-500' : 'border-white/[0.1]'}`}
          >
            <option value="">Seleccionar...</option>
            {getSectors().filter(s => s.active).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          <FieldError field="sector" />
        </div>
      </div>

      {/* Product search */}
      <div className="relative">
        <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Buscar Producto</label>
        <input
          value={productSearch}
          onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct(null); }}
          onFocus={() => productSearch.length >= 2 && setShowDropdown(true)}
          placeholder="Escribe nombre o código (ej: MAIZ, AGRO-000003)..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
        />
        {/* Dropdown */}
        {showDropdown && (filteredProducts.length > 0 || productSearch.trim().length >= 2) && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl">
            {filteredProducts.map(p => (
              <button
                key={p.c}
                onClick={() => selectProduct(p)}
                className="w-full text-left px-3 py-2 border-none bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-2 transition-colors"
              >
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/[0.08] px-1.5 py-0.5 rounded">{p.c}</span>
                <span className="text-sm text-white flex-1 truncate">{p.n}</span>
                {sectorCategory && p.g === sectorCategory && (
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/[0.1] px-1.5 py-0.5 rounded-full font-medium">{form.sector}</span>
                )}
                <span className="text-[10px] text-slate-500">{p.g}</span>
              </button>
            ))}
            {/* Free product option when no exact match or always at bottom */}
            {productSearch.trim().length >= 2 && (
              <button
                onClick={selectFreeProduct}
                className="w-full text-left px-3 py-2.5 border-t border-slate-100 dark:border-white/[0.06] bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-2 transition-colors"
              >
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/[0.08] px-1.5 py-0.5 rounded">➕</span>
                <span className="text-sm text-amber-400 flex-1 truncate">Agregar "{productSearch.trim()}" como producto libre</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product selected: compact reference + inputs */}
      {selectedProduct && (
        <div className="bg-white/[0.03] rounded-xl px-3.5 py-3 border border-white/[0.08]">
          {/* Compact reference line */}
          <div className="text-[11px] text-slate-400 mb-2.5">
            Ref: <span className="text-white font-medium">{fmtGs(selectedProduct.up)}</span>/{selectedProduct.u}
            {selectedProduct.ld && <span className="text-slate-500"> · {selectedProduct.ls} ({selectedProduct.ld})</span>}
          </div>

          {/* Qty + Price side-by-side + Add */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[10px] text-slate-400 mb-1">Cantidad ({autoUnit(selectedProduct.c)})</label>
              <input
                type="number"
                value={itemQty}
                onChange={e => {
                  const qty = parseInt(e.target.value) || 0;
                  setItemQty(qty);
                  setItemAmount(qty * itemUnitPrice);
                }}
                min={1}
                className={`w-full px-2.5 py-2 rounded-lg border bg-white/[0.05] text-sm text-white outline-none ${errors.itemQty ? 'border-red-500' : 'border-white/[0.1]'}`}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-slate-400 mb-1">P. Unit. (₲)</label>
              <input
                type="number"
                value={itemUnitPrice || ""}
                onChange={e => {
                  const up = parseInt(e.target.value) || 0;
                  setItemUnitPrice(up);
                  setItemAmount(itemQty * up);
                }}
                placeholder={selectedProduct.up > 0 ? String(selectedProduct.up) : "0"}
                className="w-full px-2.5 py-2 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none"
              />
            </div>
            <button
              onClick={addItem}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold border-none cursor-pointer transition-colors whitespace-nowrap"
            >
              + Agregar
            </button>
          </div>

          {/* Single total line */}
          {itemAmount > 0 && (
            <div className="text-[11px] text-emerald-400 mt-1.5 font-medium">Total: {fmtGs(itemAmount)}</div>
          )}

          {/* Price deviation warning */}
          {priceDeviation && (
            <div className={`mt-2 text-[11px] font-medium ${priceDeviation.level === "red" ? "text-red-400" : "text-amber-400"}`}>
              {"⚠"} {priceDeviation.msg} ({priceDeviation.pct}%)
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      {items.length > 0 && (
        <div className="bg-white/[0.02] rounded-xl border border-white/[0.06]">
          <div className="px-3 py-2 border-b border-white/[0.06] flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400">{items.length} item{items.length > 1 ? "s" : ""}</span>
            <span className="text-xs font-bold text-emerald-400">{fmtGs(totalAmount)}</span>
          </div>
          {items.map((it, i) => (
            <div key={i} className="px-3 py-2 flex items-center gap-2 border-b border-white/[0.04] last:border-b-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate flex items-center gap-1.5">
                  {it.product}
                  {it.isFreeItem && <span className="text-[9px] text-amber-400 bg-amber-500/[0.1] px-1.5 py-0.5 rounded-full font-medium">Producto libre</span>}
                </div>
                <div className="text-[10px] text-slate-500">{it.code || "Sin código"} · {it.qty} {it.unit} · {fmtGs(it.estimatedAmount)}</div>
              </div>
              <button
                onClick={() => removeItem(i)}
                className="w-6 h-6 rounded bg-red-500/10 border-none cursor-pointer text-red-400 text-xs flex items-center justify-center hover:bg-red-500/20 transition-colors"
              >
                &#10005;
              </button>
            </div>
          ))}
        </div>
      )}
      <FieldError field="items" />

      {/* Running total */}
      {totalAmount > 0 && (
        <div className="bg-emerald-500/[0.06] rounded-lg px-3.5 py-2.5 border border-emerald-500/[0.12] flex justify-between items-center">
          <span className="text-xs text-slate-400 font-medium">TOTAL ESTIMADO</span>
          <div className="text-right">
            <div className="text-sm font-bold text-emerald-400">{fmtGs(totalAmount)}</div>
            <div className="text-[10px] text-slate-500">$ {Math.round(totalAmount / usdRate).toLocaleString("en-US")} USD</div>
          </div>
        </div>
      )}
    </div>
  );
}
