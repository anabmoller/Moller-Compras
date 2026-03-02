import { useState, useMemo, useEffect } from "react";
import { GROUP_COLORS } from "../../constants";
import { supabase } from "../../lib/supabase";

// ---- Extend GROUP_COLORS for new groups ----
const ALL_GROUP_COLORS = {
  ...GROUP_COLORS,
  "Mercadería": "#6366F1",
  "Agrícola": "#2563EB",
  "Otro": "#9CA3AF",
};

function InfoField({ label, value }) {
  return (
    <div>
      <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">
        {label}
      </div>
      <div className="text-xs text-white font-medium mt-px">
        {value}
      </div>
    </div>
  );
}

export default function ProductDetailPanel({ product, onClose }) {
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const { data, error } = await supabase
        .from("price_history")
        .select("id, date, unit_price, currency, quantity, supplier_id, suppliers(name)")
        .eq("product_id", product.id)
        .order("date", { ascending: false })
        .limit(20);

      if (!error && data) {
        setPriceHistory(data);
      }
      setLoading(false);
    }
    if (product?.id) fetchHistory();
  }, [product?.id]);

  // Group prices by supplier
  const supplierStats = useMemo(() => {
    const map = {};
    priceHistory.forEach(ph => {
      const sName = ph.suppliers?.name || "Desconocido";
      if (!map[sName]) map[sName] = { prices: [], count: 0, totalQty: 0 };
      map[sName].prices.push(ph.unit_price);
      map[sName].count++;
      map[sName].totalQty += (ph.quantity || 0);
    });
    return Object.entries(map).map(([name, s]) => ({
      name,
      avgPrice: s.prices.reduce((a, b) => a + b, 0) / s.prices.length,
      minPrice: Math.min(...s.prices),
      maxPrice: Math.max(...s.prices),
      transactions: s.count,
      totalQty: s.totalQty,
      currency: priceHistory.find(p => p.suppliers?.name === name)?.currency || "USD",
    })).sort((a, b) => a.avgPrice - a.avgPrice || a.name.localeCompare(b.name));
  }, [priceHistory]);

  const fmt = (n, cur = "USD") => {
    if (!n && n !== 0) return "—";
    if (cur === "PYG" || cur === "GS") return `Gs ${Math.round(n).toLocaleString()}`;
    return `${cur} ${n.toFixed(2)}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[1000] flex justify-center items-start pt-[60px] animate-[fadeIn_0.2s_ease]"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-[#12131a] rounded-2xl w-[90%] max-w-[520px] max-h-[80vh] overflow-auto shadow-[0_10px_15px_rgba(0,0,0,0.3),0_4px_6px_rgba(0,0,0,0.2)] animate-[slideUp_0.25s_ease]"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] sticky top-0 bg-[#12131a] rounded-t-2xl z-[2]">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-base font-bold text-white leading-tight">
                {product.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex gap-2 flex-wrap items-center">
                <span className="font-mono text-[10px] bg-[#F8F9FB]/5 px-1.5 py-0.5 rounded font-semibold">
                  {product.code}
                </span>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                  style={{
                    background: (ALL_GROUP_COLORS[product.group] || "#10b981") + "15",
                    color: ALL_GROUP_COLORS[product.group] || "#10b981",
                  }}
                >
                  {product.group}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-[#F8F9FB]/5 border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-sm text-slate-400 shrink-0 hover:bg-[#F8F9FB]/10 transition-colors"
            >
              {"✕"}
            </button>
          </div>
        </div>

        {/* Product details grid */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
            {product.manufacturer && (
              <InfoField label="Fabricante" value={product.manufacturer} />
            )}
            {product.presentation && (
              <InfoField label="Presentación" value={product.presentation} />
            )}
            {product.unit && (
              <InfoField label="Unidad" value={product.unit} />
            )}
            {product.species && (
              <InfoField label="Especie" value={product.species} />
            )}
            {product.administration_route && (
              <InfoField label="Vía Admin." value={product.administration_route} />
            )}
            {product.tipo_uso && (
              <InfoField label="Tipo de Uso" value={product.tipo_uso} />
            )}
            {product.deposit && (
              <InfoField label="Depósito" value={product.deposit} />
            )}
            {product.criticality && (
              <InfoField label="Criticidad" value={product.criticality} />
            )}
          </div>
        </div>

        {/* Supplier price history */}
        <div className="px-5 pb-5 border-t border-white/[0.06]">
          <div className="text-xs font-bold text-white py-3.5 pb-2.5 flex items-center gap-1.5">
            {"📊"} Historial de Proveedores & Precios
          </div>

          {loading ? (
            <div className="text-xs text-slate-400 py-3">
              Cargando historial...
            </div>
          ) : supplierStats.length === 0 ? (
            <div className="bg-[#F8F9FB]/5 rounded-xl px-4 py-5 text-center">
              <div className="text-2xl mb-1.5">{"📋"}</div>
              <div className="text-xs text-slate-400 font-medium">
                Sin historial de compras registrado
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Los precios aparecer{"á"}n a medida que se registren compras
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {supplierStats.map((s, idx) => (
                <div
                  key={s.name}
                  className="rounded-xl px-3.5 py-3"
                  style={{
                    background: idx === 0 ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${idx === 0 ? "rgba(16,185,129,0.19)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-white flex items-center gap-1.5">
                        {idx === 0 && <span className="text-[11px]">{"⭐"}</span>}
                        {s.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {s.transactions} compra{s.transactions !== 1 ? "s" : ""}
                        {s.totalQty > 0 && ` · ${s.totalQty.toLocaleString()} unidades`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-[15px] font-bold"
                        style={{ color: idx === 0 ? "#10b981" : "#ffffff" }}
                      >
                        {fmt(s.avgPrice, s.currency)}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        promedio/unidad
                      </div>
                    </div>
                  </div>

                  {/* Price range bar */}
                  {s.minPrice !== s.maxPrice && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{fmt(s.minPrice, s.currency)}</span>
                      <div className="flex-1 h-[3px] bg-[#F8F9FB]/[0.08] rounded-full relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/25 to-emerald-500" />
                      </div>
                      <span>{fmt(s.maxPrice, s.currency)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recent transactions */}
          {priceHistory.length > 0 && (
            <>
              <div className="text-[11px] font-semibold text-slate-300 pt-3.5 pb-1.5">
                {"Ú"}ltimas transacciones
              </div>
              {priceHistory.slice(0, 5).map((ph, idx) => (
                <div
                  key={ph.id || idx}
                  className={`flex justify-between py-1.5 text-[11px] ${idx < 4 ? "border-b border-white/[0.06]" : ""}`}
                >
                  <span className="text-slate-400">
                    {ph.date ? new Date(ph.date).toLocaleDateString("es-PY") : "—"}
                  </span>
                  <span className="text-slate-300 flex-1 ml-3">
                    {ph.suppliers?.name || "—"}
                  </span>
                  <span className="font-semibold text-white">
                    {fmt(ph.unit_price, ph.currency)}
                    {ph.quantity ? ` × ${ph.quantity}` : ""}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
