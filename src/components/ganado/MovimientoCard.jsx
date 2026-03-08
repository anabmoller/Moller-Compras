import { GANADO_STATUS_FLOW, GANADO_EXTRA_STATUSES, getCategorias } from "../../constants/ganado";
import { useEntityScope } from "../../hooks/useEntityScope";

function getStatusInfo(estado) {
  const all = [...GANADO_STATUS_FLOW, ...GANADO_EXTRA_STATUSES];
  return all.find(s => s.key === estado) || { label: estado, color: "#64748b", icon: "?" };
}

export default function MovimientoCard({ movimiento, onClick }) {
  const { scopedEstablishments, scopedCompanies } = useEntityScope();
  const status = getStatusInfo(movimiento.estado);
  const allCategorias = getCategorias();
  const origen = scopedEstablishments.find(e => e._uuid === movimiento.establecimientoOrigenId);

  const destino = movimiento.destinoNombre
    || scopedCompanies.find(c => c._uuid === movimiento.empresaDestinoId)?.name
    || scopedEstablishments.find(e => e._uuid === movimiento.establecimientoDestinoId)?.name
    || "—";

  // Build category summary from detail rows
  const categoriaSummary = (movimiento.categorias || [])
    .map(d => {
      const cat = allCategorias.find(c => c.id === d.categoriaId);
      return cat ? `${d.cantidad} ${cat.codigo}` : `${d.cantidad}`;
    })
    .join(", ") || "—";

  const formatCurrency = (val, mon) => {
    if (!val) return "—";
    const symbol = mon === "USD" ? "US$" : mon === "BRL" ? "R$" : "Gs.";
    return `${symbol} ${Number(val).toLocaleString("es-PY")}`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-[#13141a] border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:bg-[#1a1b23] hover:border-white/[0.1] transition-all group"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{movimiento.id || "—"}</span>
          <span className="text-[10px] text-slate-500">{movimiento.fechaEmision}</span>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ backgroundColor: status.color + "20", color: status.color }}
        >
          {status.icon} {status.label}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <span className="text-slate-500">Origen: </span>
          <span className="text-slate-300">{origen?.name || "—"}</span>
        </div>
        <div>
          <span className="text-slate-500">Destino: </span>
          <span className="text-slate-300">{destino}</span>
        </div>
        <div className="col-span-2">
          <span className="text-slate-500">Categorías: </span>
          <span className="text-slate-300">{categoriaSummary}</span>
        </div>
        <div>
          <span className="text-slate-500">Total: </span>
          <span className="text-white font-semibold">{movimiento.cantidadTotal} cab.</span>
        </div>
        {movimiento.pesoTotalKg > 0 && (
          <div>
            <span className="text-slate-500">Peso: </span>
            <span className="text-slate-300">{movimiento.pesoTotalKg.toLocaleString("es-PY")} kg</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
        <span className="text-[10px] text-slate-500">
          {movimiento.tipoOperacion?.replace("_", " ")} / {movimiento.finalidad}
        </span>
        <span className="text-xs font-semibold text-[#C8A03A]">
          {formatCurrency(movimiento.precioTotal, movimiento.moneda)}
        </span>
      </div>
    </div>
  );
}
