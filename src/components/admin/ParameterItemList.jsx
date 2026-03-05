import { TIPO_ENTIDAD_LABELS, REGIMEN_CONTROL_LABELS } from "../../constants/establecimientos";

const BADGE_COLORS = {
  // tipo_entidad
  establecimiento:  "bg-blue-500/[0.12] text-blue-400 border-blue-500/20",
  proveedor_ganado: "bg-amber-500/[0.12] text-amber-400 border-amber-500/20",
  proveedor_granos: "bg-green-500/[0.12] text-green-400 border-green-500/20",
  industria:        "bg-purple-500/[0.12] text-purple-400 border-purple-500/20",
  // regimen_control
  propio:    "bg-emerald-500/[0.12] text-emerald-400 border-emerald-500/20",
  arrendado: "bg-orange-500/[0.12] text-orange-400 border-orange-500/20",
  cenabico:  "bg-cyan-500/[0.12] text-cyan-400 border-cyan-500/20",
};

function formatName(raw) {
  if (!raw) return "\u2014";
  const username = raw.includes("@") ? raw.split("@")[0] : raw;
  const parts = username.split(/[.\s_-]+/);
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function SortHeader({ label, sortKey, active, dir, onClick, flex = "flex-1" }) {
  const isActive = active === sortKey;
  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`${flex} flex items-center gap-1 px-1 py-1 text-[10px] font-semibold uppercase tracking-wider border-none bg-transparent cursor-pointer transition-colors ${
        isActive ? 'text-[#C8A03A]' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {label}
      <span className="text-[9px]">
        {isActive ? (dir === "asc" ? "\u25b2" : "\u25bc") : "\u21c5"}
      </span>
    </button>
  );
}

function ClassificationBadges({ item }) {
  const tipo = item.tipo_entidad;
  const regimen = item.regimen_control;
  if (!tipo && !regimen) return null;

  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {tipo && (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${BADGE_COLORS[tipo] || "bg-slate-500/[0.12] text-slate-400 border-slate-500/20"}`}>
          {TIPO_ENTIDAD_LABELS[tipo] || tipo}
        </span>
      )}
      {regimen && (
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${BADGE_COLORS[regimen] || "bg-slate-500/[0.12] text-slate-400 border-slate-500/20"}`}>
          {REGIMEN_CONTROL_LABELS[regimen] || regimen}
        </span>
      )}
    </div>
  );
}

export default function ParameterItemList({
  tab, sorted, sortKey, sortDir, saving,
  onToggleSort, onEdit, onToggle, onDetail, renderSubtitle,
}) {
  return (
    <>
      {/* Sortable Column Headers */}
      <div className="flex gap-2 mb-2 px-1">
        <SortHeader label="Nombre" sortKey="name" active={sortKey} dir={sortDir} onClick={onToggleSort} flex="flex-1" />
        {tab === "establishments" && <SortHeader label="Empresa" sortKey="company" active={sortKey} dir={sortDir} onClick={onToggleSort} flex="w-24" />}
        {tab === "suppliers" && <SortHeader label="Categor\u00eda" sortKey="category" active={sortKey} dir={sortDir} onClick={onToggleSort} flex="w-24" />}
        {tab === "companies" && <SortHeader label="Tipo" sortKey="type" active={sortKey} dir={sortDir} onClick={onToggleSort} flex="w-24" />}
        <div className="w-[130px] flex-shrink-0" />
      </div>

      {/* Items List */}
      {sorted.map(item => (
        <div
          key={item.id}
          onClick={() => onDetail && onDetail(item)}
          className={`bg-[#F8F9FB]/[0.03] rounded-xl px-4 py-3.5 mb-2 border border-white/[0.06] flex items-center gap-3 shadow-sm ${(item.active !== false) ? 'opacity-100' : 'opacity-50'} ${onDetail ? 'cursor-pointer hover:border-[#C8A03A]/30 transition-colors' : ''}`}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">
              {item.name}
              {item.code && (
                <span className="text-[10px] text-slate-400 ml-2 bg-[#F8F9FB]/[0.02] px-1.5 py-0.5 rounded">
                  {item.code}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {renderSubtitle(item)}
            </div>
            {tab === "establishments" && <ClassificationBadges item={item} />}
          </div>
          <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button onClick={() => onEdit(item)} disabled={saving} className={`bg-[#1F2A44]/[0.06] border-none rounded-lg px-2.5 py-1.5 cursor-pointer text-xs text-[#C8A03A] font-medium ${saving ? 'opacity-50' : ''}`}>
              Editar
            </button>
            <button onClick={() => onToggle(item.id)} disabled={saving} className={`border-none rounded-lg px-2.5 py-1.5 cursor-pointer text-xs font-medium ${saving ? 'opacity-50' : ''} ${(item.active !== false) ? 'bg-red-500/[0.06] text-red-400' : 'bg-green-500/[0.06] text-green-400'}`}>
              {(item.active !== false) ? "Desact." : "Activar"}
            </button>
          </div>
        </div>
      ))}

      {sorted.length === 0 && (
        <div className="text-center p-10 text-slate-400 text-[13px]">
          No se encontraron registros
        </div>
      )}
    </>
  );
}
