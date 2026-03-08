import { useState } from "react";
import {
  BarChart3, ShoppingCart, Package, Truck, Paperclip,
  Clock, FileEdit, RefreshCw, ClipboardList,
} from "lucide-react";
import { BullIcon } from "../icons";
import { useEntityScope } from "../../hooks/useEntityScope";
import { formatGuaranies } from "../../utils/statusHelpers";
import RequestCard from "./RequestCard";
import RequestsTable from "./RequestsTable";
import EmptyState from "../shared/EmptyState";

/* ── Filter definitions ───────────────────────────────────── */

const MODULE_FILTERS = [
  { key: "todas", label: "Todas", icon: <BarChart3 size={14} /> },
  { key: "compras", label: "Compras", icon: <ShoppingCart size={14} /> },
  { key: "ganado", label: "Ganado", icon: <BullIcon size={14} /> },
  { key: "inventario", label: "Inventario", icon: <Package size={14} /> },
  { key: "fretes", label: "Fretes", icon: <Truck size={14} /> },
  { key: "otros", label: "Otros", icon: <Paperclip size={14} /> },
];

const STATUS_FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "pend_aprobacion", label: "Pend. aprobación" },
  { key: "borrador", label: "Borrador" },
  { key: "autorizado", label: "Autorizado" },
  { key: "rechazado", label: "Rechazado" },
  { key: "en_proceso", label: "En proceso" },
];

const RELATION_FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "creadas", label: "Creadas por mí" },
  { key: "asignadas", label: "Asignadas a mí" },
  { key: "pendientes", label: "Pendientes de mi aprobación" },
];

/**
 * Unified request inbox — Solicitudes
 */
export default function Dashboard({
  requests,
  filtered,
  statusCounts,
  filterStatus,
  setFilterStatus,
  filterEstablishment,
  setFilterEstablishment,
  searchQuery,
  setSearchQuery,
  onSelectRequest,
  usdRate,
}) {
  const { scopedEstablishments } = useEntityScope();
  const [viewMode, setViewMode] = useState("cards");
  const [moduleFilter, setModuleFilter] = useState("todas");
  const [relationFilter, setRelationFilter] = useState("todas");

  const pendingCount = requests.filter(r => {
    const s = r.status;
    return s === "pend_autorizacion" || s === "pend_aprobacion" || s === "pendiente_aprobacion" || s === "aprobacion_gerente" || s === "pendiente";
  }).length;
  const draftCount = requests.filter(r => r.status === "borrador").length;
  const inProcessCount = requests.filter(r => {
    const s = r.status;
    return s === "en_cotizacion" || s === "orden_compra" || s === "en_proceso" || s === "cotizacion";
  }).length;

  // Apply local module + relation filters on top of already-filtered list
  const localFiltered = filtered.filter(r => {
    const mod = r.module || "compras";
    if (moduleFilter !== "todas" && mod !== moduleFilter) return false;
    if (relationFilter === "creadas" && r.requester !== "Ana Beatriz Moller") return false;
    if (relationFilter === "asignadas" && r.assignee !== "Ana Beatriz Moller" && r.assignee !== undefined) return false;
    if (relationFilter === "pendientes") {
      const s = r.status;
      if (s !== "pend_autorizacion" && s !== "pend_aprobacion" && s !== "pendiente_aprobacion" && s !== "aprobacion_gerente" && s !== "pendiente") return false;
    }
    return true;
  });

  return (
    <div className="animate-fade-in">
      {/* Page title */}
      <div className="px-5 pt-5">
        <h2 className="text-[22px] font-bold text-white tracking-tight mb-1">
          Solicitudes
        </h2>
        <p className="text-sm text-slate-500 m-0">
          Acciones y solicitudes relacionadas contigo
        </p>
      </div>

      {/* KPI counters */}
      <div className="grid grid-cols-3 gap-2.5 px-5 py-4">
        <CounterCard label="Por aprobar" value={pendingCount} color="text-amber-400" icon={<Clock size={16} />} />
        <CounterCard label="Borradores" value={draftCount} color="text-slate-400" icon={<FileEdit size={16} />} />
        <CounterCard label="En proceso" value={inProcessCount} color="text-blue-400" icon={<RefreshCw size={16} />} />
      </div>

      {/* Module filter */}
      <div className="px-5 pb-2">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Módulo</div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {MODULE_FILTERS.map(m => (
            <FilterPill
              key={m.key}
              active={moduleFilter === m.key}
              onClick={() => setModuleFilter(m.key)}
              label={`${m.icon} ${m.label}`}
            />
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div className="px-5 pb-2">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Estado</div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map(s => (
            <FilterPill
              key={s.key}
              active={filterStatus === (s.key === "todos" ? "all" : s.key)}
              onClick={() => setFilterStatus(s.key === "todos" ? "all" : s.key)}
              label={s.label}
            />
          ))}
        </div>
      </div>

      {/* Relation filter */}
      <div className="px-5 pb-3">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Relación</div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {RELATION_FILTERS.map(rf => (
            <FilterPill
              key={rf.key}
              active={relationFilter === rf.key}
              onClick={() => setRelationFilter(rf.key)}
              label={rf.label}
            />
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-5 pb-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex items-center gap-2 bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-lg px-3.5 py-2.5">
            <svg width="16" height="16" viewBox="0 0 20 20" className="fill-slate-500 shrink-0">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              placeholder="Buscar por título, producto, proveedor o código..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border-none bg-transparent outline-none text-sm text-white w-full placeholder:text-slate-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="bg-none border-none cursor-pointer text-xs text-slate-500 px-1 hover:text-slate-300"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
          <select
            value={filterEstablishment}
            onChange={e => setFilterEstablishment(e.target.value)}
            className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white cursor-pointer min-w-[110px]"
          >
            <option value="all">Todos estab.</option>
            {scopedEstablishments.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
          </select>
          {/* View Toggle (desktop) */}
          <div className="desktop-view-toggle gap-0.5 bg-[#F8F9FB]/[0.03] rounded-md p-0.5 border border-white/[0.06]">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1.5 rounded text-sm border-none cursor-pointer transition-colors ${
                viewMode === "cards" ? "bg-[#F8F9FB]/[0.08] text-white" : "bg-transparent text-slate-500"
              }`}
            >☰</button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1.5 rounded text-sm border-none cursor-pointer transition-colors ${
                viewMode === "table" ? "bg-[#F8F9FB]/[0.08] text-white" : "bg-transparent text-slate-500"
              }`}
            >▤</button>
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div className="px-5 pb-2">
        <p className="text-[11px] text-slate-500 m-0">
          {localFiltered.length} de {requests.length} solicitudes
        </p>
      </div>

      {/* Requests List / Table */}
      <div className="px-5 pb-[120px]">
        {viewMode === "table" ? (
          <RequestsTable requests={localFiltered} onSelectRequest={onSelectRequest} />
        ) : localFiltered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={40} className="text-slate-500" />}
            title="No se encontraron solicitudes"
            description="Intenta cambiar los filtros o crea una nueva solicitud"
          />
        ) : (
          localFiltered.map(r => (
            <RequestCard key={r.id} request={r} onClick={() => onSelectRequest(r)} usdRate={usdRate} />
          ))
        )}
      </div>
    </div>
  );
}

function CounterCard({ label, value, color, icon }) {
  return (
    <div className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
      <div className="text-sm mb-1">{icon}</div>
      <div className={`text-xl font-bold ${color} leading-tight`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{label}</div>
    </div>
  );
}

function FilterPill({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
        active
          ? 'bg-[#1F2A44]/10 text-[#C8A03A] border-[#C8A03A]/20'
          : 'bg-[#F8F9FB]/[0.03] text-slate-400 border-white/[0.06] hover:bg-[#F8F9FB]/[0.06]'
      }`}
    >
      {label}
    </button>
  );
}
