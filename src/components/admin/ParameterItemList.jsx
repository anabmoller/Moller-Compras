function formatName(raw) {
  if (!raw) return "—";
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
        isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {label}
      <span className="text-[9px]">
        {isActive ? (dir === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </button>
  );
}

export default function ParameterItemList({
  tab, sorted, sortKey, sortDir, saving,
  onToggleSort, onEdit, onToggle, renderSubtitle,
}) {
  return (
    <>
      {/* Sortable Column Headers */}
      <div className="flex gap-2 mb-2 px-1">
        <SortHeader label="Nombre" sortKey="name" active={sortKey} dir={sortDir} onClick={onToggleSort} flex="flex-1" />
        {tab === "establishments" && <SortHeader label="Empresa" sortKey="company" active={sortKey} dir={sortDir} onClick={onToggleSort} flex="w-24" />}
        {tab === "suppliers" && <SortHeader label="Categoría" sortKey="category" active={sortKey} dir={sortDir} onClick={onToggleSort} flex="w-24" />}
        {tab === "companies" && <SortHeader label="Tipo" sortKey="type" active={sortKey} dir={sortDir} onClick={onToggleSort} flex="w-24" />}
        <div className="w-[130px] flex-shrink-0" />
      </div>

      {/* Items List */}
      {sorted.map(item => (
        <div key={item.id} className={`bg-white/[0.03] rounded-xl px-4 py-3.5 mb-2 border border-white/[0.06] flex items-center gap-3 shadow-sm ${(item.active !== false) ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">
              {item.name}
              {item.code && (
                <span className="text-[10px] text-slate-400 ml-2 bg-white/[0.02] px-1.5 py-0.5 rounded">
                  {item.code}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {renderSubtitle(item)}
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => onEdit(item)} disabled={saving} className={`bg-emerald-500/[0.06] border-none rounded-lg px-2.5 py-1.5 cursor-pointer text-xs text-emerald-400 font-medium ${saving ? 'opacity-50' : ''}`}>
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
