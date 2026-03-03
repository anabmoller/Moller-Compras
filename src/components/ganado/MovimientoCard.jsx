import { GANADO_STATUS_FLOW, GANADO_EXTRA_STATUSES, getCategorias } from "../../constants/ganado";
import { getEstablishments, getCompanies } from "../../constants/parameters";

function getStatusInfo(estado) {
  const all = [...GANADO_STATUS_FLOW, ...GANADO_EXTRA_STATUSES];
  return all.find(s => s.key === estado) || { label: estado, color: "#64748b", icon: "?" };
}

export default function MovimientoCard({ movimiento, onClick }) {
  const status = getStatusInfo(movimiento.estado);
  const categoria = getCategorias().find(c => c.id === movimiento.categoriaId);
  const origen = getEstablishments().find(e => e._uuid === movimiento.establecimientoOrigenId);

  const destino = movimiento.destinoNombre
    || getCompanies().find(c => c._uuid === movimiento.empresaDestinoId)?.name
    || getEstablishments().find(e => e._uuid === movimiento.establecimientoDestinoId)?.name
    || "—";

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
        <div>
          <span className="text-slate-500">Categoría: </span>
          <span className="text-slate-300">{categoria?.nombre || "—"}</span>
        </div>
        <div>
          <span className="text-slate-500">Cantidad: </span>
          <span className="text-white font-semibold">{movimiento.cantidad} cab.</span>
        </div>
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
