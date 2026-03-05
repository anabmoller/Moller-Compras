import { useState, useCallback, useMemo } from "react";
import {
  getParameters, addParameterItem, updateParameterItem,
  toggleParameterItem, initParameters,
} from "../../constants/parameters";
import { TIPO_ENTIDAD_LABELS, REGIMEN_CONTROL_LABELS } from "../../constants/establecimientos";
import ParameterForm from "./ParameterForm";
import ParameterItemList from "./ParameterItemList";
import EntityDetailModal from "./EntityDetailModal";

const TABS = [
  { key: "establishments", label: "Establecimientos", icon: "📍" },
  { key: "sectors", label: "Sectores", icon: "🏷" },
  { key: "productTypes", label: "Tipos Producto", icon: "📦" },
  { key: "suppliers", label: "Proveedores", icon: "🏪" },
  { key: "companies", label: "Empresas", icon: "🏢" },
];

function formatName(raw) {
  if (!raw) return "—";
  const username = raw.includes("@") ? raw.split("@")[0] : raw;
  const parts = username.split(/[.\s_-]+/);
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

export default function ParametersScreen({ onBack }) {
  const [tab, setTab] = useState("establishments");
  const [params, setParams] = useState(() => getParameters());
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  // Establishment-specific filters
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterRegimen, setFilterRegimen] = useState("todos");
  const [filterOrigen, setFilterOrigen] = useState("todos");
  // Entity detail modal
  const [detailItem, setDetailItem] = useState(null);

  const refresh = useCallback(() => setParams({ ...getParameters() }), []);

  const items = params[tab] || [];

  // Get unique departamentos for the Origen filter
  const departamentos = useMemo(() => {
    if (tab !== "establishments") return [];
    const deps = [...new Set(items.map(i => i.departamento).filter(Boolean))].sort();
    return deps;
  }, [tab, items]);

  const filtered = items.filter(i => {
    // Text search across name, code, senacsa_code, departamento
    if (search) {
      const q = search.toLowerCase();
      const haystack = [i.name, i.code, i.senacsa_code, i.departamento, i.company]
        .filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    // Establishment-specific filters
    if (tab === "establishments") {
      if (filterTipo !== "todos" && i.tipo_entidad !== filterTipo) return false;
      if (filterRegimen !== "todos" && i.regimen_control !== filterRegimen) return false;
      if (filterOrigen !== "todos" && i.departamento !== filterOrigen) return false;
    }
    return true;
  });
  const activeCount = items.filter(i => i.active !== false).length;

  const sorted = [...filtered].sort((a, b) => {
    const av = (a[sortKey] || "").toString().toLowerCase();
    const bv = (b[sortKey] || "").toString().toLowerCase();
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editingItem) {
        await updateParameterItem(tab, editingItem.id, formData);
      } else {
        await addParameterItem(tab, formData);
      }
      refresh();
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error("[Parameters] Save failed:", err);
      setActionError("Error al guardar: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    setSaving(true);
    try {
      await toggleParameterItem(tab, id);
      refresh();
    } catch (err) {
      console.error("[Parameters] Toggle failed:", err);
      setActionError("Error al cambiar estado: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("¿Refrescar todos los parámetros desde el servidor?")) {
      setSaving(true);
      try {
        await initParameters();
        refresh();
      } catch (err) {
        console.error("[Parameters] Refresh failed:", err);
        setActionError("Error al refrescar: " + (err.message || "Error desconocido"));
      } finally {
        setSaving(false);
      }
    }
  };

  const renderSubtitle = (item) => {
    switch (tab) {
      case "establishments": {
        const mgrName = formatName(item.manager);
        const parts = [item.company, `Gte: ${mgrName}`];
        if (item.senacsa_code) parts.push(`SENACSA: ${item.senacsa_code}`);
        if (item.senacsa_unidad_zonal) parts.push(item.senacsa_unidad_zonal);
        else if (item.location) parts.push(item.location);
        return parts.filter(Boolean).join(" · ");
      }
      case "sectors":
        return item.description || "";
      case "productTypes":
        return item.description || "";
      case "suppliers":
        return [item.category, item.phone].filter(Boolean).join(" · ");
      case "companies":
        return `${item.type === "empresa" ? "Empresa" : "Persona Física"} · Dir: ${formatName(item.director)}`;
      default:
        return "";
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="px-5 py-3 flex justify-between items-center">
        <button onClick={onBack} className="bg-transparent border-none cursor-pointer text-sm text-[#C8A03A] font-medium">
          {"←"} Volver
        </button>
        <button onClick={handleReset} disabled={saving} className={`bg-transparent border-none text-xs font-medium ${saving ? 'cursor-default text-slate-500 opacity-60' : 'cursor-pointer text-amber-400'}`}>
          {saving ? "Cargando..." : "Refrescar"}
        </button>
      </div>

      <div className="px-5">
        <h2 className="text-[22px] font-semibold text-white mb-1 mt-0">
          Par{"á"}metros del Sistema
        </h2>
        <div className="text-[13px] text-slate-400 mb-4">
          Configurar establecimientos, sectores, productos y proveedores
        </div>
      </div>

      {/* Error banner */}
      {actionError && (
        <div className="mx-5 mb-3 px-3.5 py-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/[0.19] flex justify-between items-center">
          <span className="text-xs text-red-400 font-medium">{actionError}</span>
          <button onClick={() => setActionError(null)} className="bg-none border-none cursor-pointer text-sm text-red-400 px-1">{"✕"}</button>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-1 px-5 pb-3 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); setShowForm(false); setEditingItem(null); setFilterTipo("todos"); setFilterRegimen("todos"); setFilterOrigen("todos"); setDetailItem(null); }} className={`px-3.5 py-2 rounded-xl border-none text-xs font-semibold cursor-pointer whitespace-nowrap ${
            tab === t.key
              ? 'bg-[#1F2A44] text-white shadow-md shadow-black/20'
              : 'bg-[#F8F9FB]/[0.03] text-slate-400 shadow-sm'
          }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 pb-[120px]">
        {/* Search + Add */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
            <span className="text-sm opacity-40">{"🔍"}</span>
            <input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-none bg-transparent outline-none text-[13px] text-white w-full"
            />
          </div>
          <button onClick={() => { setEditingItem(null); setShowForm(true); }} disabled={saving} className={`px-4 py-2 rounded-xl border-none text-xs font-semibold text-white cursor-pointer whitespace-nowrap ${saving ? 'bg-[#F8F9FB]/[0.06] opacity-60' : 'bg-gradient-to-br from-[#1F2A44] to-[#C8A03A]'}`}>
            + Nuevo
          </button>
        </div>

        {/* Establishment Filters */}
        {tab === "establishments" && (
          <div className="mb-3 flex flex-col gap-2">
            {/* Tipo chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {[
                { key: "todos", label: "Todos" },
                { key: "establecimiento", label: "Bajo Gesti\u00f3n" },
                { key: "proveedor_ganado", label: "Prov. Ganado" },
                { key: "proveedor_granos", label: "Prov. Granos" },
                { key: "industria", label: "Industrias" },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setFilterTipo(opt.key)}
                  className={`px-3 py-1.5 rounded-full border-none text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                    filterTipo === opt.key
                      ? "bg-[#C8A03A] text-[#0B1120]"
                      : "bg-[#F8F9FB]/[0.04] text-slate-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* R\u00e9gimen + Origen selects row */}
            <div className="flex gap-2">
              <select
                value={filterRegimen}
                onChange={e => setFilterRegimen(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-[#F8F9FB]/[0.03] text-[11px] text-slate-300 outline-none"
              >
                <option value="todos">R\u00e9gimen: Todos</option>
                {Object.entries(REGIMEN_CONTROL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                value={filterOrigen}
                onChange={e => setFilterOrigen(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-[#F8F9FB]/[0.03] text-[11px] text-slate-300 outline-none"
              >
                <option value="todos">Origen: Todos</option>
                {departamentos.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Count badge */}
        <div className="text-[11px] text-slate-400 mb-2.5 font-medium">
          {activeCount} activos de {items.length} total &middot; Mostrando {filtered.length}
        </div>

        {/* Form Modal */}
        {showForm && (
          <ParameterForm
            tab={tab}
            item={editingItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
            saving={saving}
          />
        )}

        {/* Items list with sort headers */}
        <ParameterItemList
          tab={tab}
          sorted={sorted}
          sortKey={sortKey}
          sortDir={sortDir}
          saving={saving}
          onToggleSort={toggleSort}
          onEdit={(item) => { setEditingItem(item); setShowForm(true); }}
          onToggle={handleToggle}
          onDetail={tab === "establishments" ? (item) => setDetailItem(item) : null}
          renderSubtitle={renderSubtitle}
        />
      </div>

      {/* Entity Detail Modal */}
      {detailItem && (
        <EntityDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={(item) => { setDetailItem(null); setEditingItem(item); setShowForm(true); }}
        />
      )}
    </div>
  );
}
