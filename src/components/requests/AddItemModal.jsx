// ============================================================
// YPOTI — AddItemModal (extracted from RequestDetail)
// Catalog search + manual item entry for adding to a request
// ============================================================
import { useState } from "react";
import { INVENTORY_ITEMS } from "../../constants";
import ModalBackdrop from "../common/ModalBackdrop";

export default function AddItemModal({ onClose, onAdd }) {
  const [tab, setTab] = useState("catalogo"); // catalogo | manual
  const [search, setSearch] = useState("");
  const [manual, setManual] = useState({ codigo: "", nombre: "", cantidad: 1, unidad: "un", precioUnitario: 0, proveedor: "" });

  const filtered = INVENTORY_ITEMS.filter(it =>
    it.name.toLowerCase().includes(search.toLowerCase()) ||
    it.code.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 15);

  const handleSelectCatalog = (item) => {
    onAdd({
      codigo: item.code,
      nombre: item.name,
      cantidad: 1,
      unidad: "un",
      precioUnitario: 0,
      proveedor: "",
    });
  };

  const handleManualAdd = () => {
    if (!manual.nombre) return;
    onAdd({ ...manual, precioUnitario: Number(manual.precioUnitario) || 0, cantidad: Number(manual.cantidad) || 1 });
  };

  return (
    <ModalBackdrop onClose={onClose} variant="center">
      <div className="bg-[#0B1120] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white m-0">
            Agregar Item
          </h3>
          <button onClick={onClose} className="bg-white/[0.06] border-none w-[30px] h-[30px] rounded-lg cursor-pointer text-sm text-white flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-5 mb-3">
          {[{ key: "catalogo", label: "Catálogo" }, { key: "manual", label: "Manual" }].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 border-none text-xs font-semibold cursor-pointer ${
                tab === t.key ? 'bg-emerald-500 text-white' : 'bg-white/[0.03] text-white'
              } ${t.key === "catalogo" ? 'rounded-l-lg' : 'rounded-r-lg'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-auto px-5 pb-5 flex-1">
          {tab === "catalogo" ? (
            <>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 mb-2.5"
                autoFocus
              />
              {filtered.length === 0 ? (
                <div className="text-center p-5 text-[13px] text-slate-400">
                  Sin resultados
                </div>
              ) : (
                filtered.map(it => (
                  <button
                    key={it.code}
                    onClick={() => handleSelectCatalog(it)}
                    className="w-full text-left px-3 py-2.5 bg-white/[0.03] rounded-lg border border-white/[0.06] mb-1.5 cursor-pointer"
                  >
                    <div className="text-[10px] text-emerald-400 font-semibold">{it.code}</div>
                    <div className="text-[13px] font-medium text-white">{it.name}</div>
                    <div className="text-[10px] text-slate-400">{it.type} · {it.group}</div>
                  </button>
                ))
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Nombre *</label>
                <input value={manual.nombre} onChange={e => setManual({ ...manual, nombre: e.target.value })} placeholder="Nombre del item" className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50" autoFocus />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Código</label>
                  <input value={manual.codigo} onChange={e => setManual({ ...manual, codigo: e.target.value })} placeholder="Ej: VET-001" className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50" />
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Cantidad</label>
                  <input type="number" value={manual.cantidad} onChange={e => setManual({ ...manual, cantidad: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50" />
                </div>
                <div className="w-[70px]">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Unidad</label>
                  <input value={manual.unidad} onChange={e => setManual({ ...manual, unidad: e.target.value })} placeholder="un" className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Precio Unitario ₲</label>
                  <input type="number" value={manual.precioUnitario} onChange={e => setManual({ ...manual, precioUnitario: e.target.value })} className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Proveedor</label>
                  <input value={manual.proveedor} onChange={e => setManual({ ...manual, proveedor: e.target.value })} placeholder="Opcional" className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50" />
                </div>
              </div>
              <button
                onClick={handleManualAdd}
                disabled={!manual.nombre}
                className={`w-full py-3.5 rounded-xl border-none text-[13px] font-semibold mt-1 ${
                  manual.nombre
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white cursor-pointer'
                    : 'bg-white/[0.06] text-slate-500 cursor-default'
                }`}
              >
                Agregar Item
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
}
