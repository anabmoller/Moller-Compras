import { useState, useCallback } from "react";
import { getEstablishments } from "../../constants/parameters";
import { getStatusDisplay, formatGuaranies } from "../../utils/statusHelpers";
import RequestCard from "./RequestCard";
import RequestsTable from "./RequestsTable";
import EmptyState from "../shared/EmptyState";

/**
 * Dashboard principal — dark mode Tailwind
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
  const [viewMode, setViewMode] = useState("cards");

  const pendingCount = requests.filter(r => {
    const s = r.status;
    return s === "pend_autorizacion" || s === "pend_aprobacion" || s === "pendiente_aprobacion" || s === "aprobacion_gerente" || s === "pendiente";
  }).length;
  const draftCount = requests.filter(r => r.status === "borrador").length;
  const inProcessCount = requests.filter(r => {
    const s = r.status;
    return s === "en_cotizacion" || s === "orden_compra" || s === "en_proceso" || s === "cotizacion";
  }).length;
  const totalAmount = requests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  return (
    <div className="animate-fade-in">
      {/* Page title */}
      <div className="px-5 pt-5">
        <h2 className="text-[22px] font-bold text-white tracking-tight mb-1">
          Solicitudes de Compra
        </h2>
        <p className="text-sm text-slate-500 m-0">
          {requests.length} solicitudes · {filtered.length} mostradas
        </p>
      </div>

      {/* KPI counters */}
      <div className="grid grid-cols-4 gap-2.5 px-5 py-4">
        <CounterCard label="Por aprobar" value={pendingCount} color="text-amber-400" icon="⏳" />
        <CounterCard label="Borradores" value={draftCount} color="text-slate-400" icon="📝" />
        <CounterCard label="En proceso" value={inProcessCount} color="text-blue-400" icon="🔄" />
        <CounterCard label="Total ₲" value={formatGuaranies(totalAmount)} color="text-emerald-400" icon="💰" small />
      </div>

      {/* Status filter pills */}
      <div className="px-5 pb-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <FilterPill
            active={filterStatus === "all"}
            onClick={() => setFilterStatus("all")}
            label={`Todos (${requests.length})`}
          />
          {statusCounts.filter(s => s.count > 0).map(s => (
            <FilterPill
              key={s.key}
              active={filterStatus === s.key}
              onClick={() => setFilterStatus(s.key)}
              label={`${s.icon} ${s.label} (${s.count})`}
              activeColor={s.color}
            />
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-5 pb-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3.5 py-2.5">
            <svg width="16" height="16" viewBox="0 0 20 20" className="fill-slate-500 shrink-0">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              placeholder="Buscar solicitud..."
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
            className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white cursor-pointer min-w-[110px]"
          >
            <option value="all">Todos estab.</option>
            {getEstablishments().map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
          </select>
          {/* View Toggle (desktop) */}
          <div className="desktop-view-toggle gap-0.5 bg-white/[0.03] rounded-md p-0.5 border border-white/[0.06]">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1.5 rounded text-sm border-none cursor-pointer transition-colors ${
                viewMode === "cards" ? "bg-white/[0.08] text-white" : "bg-transparent text-slate-500"
              }`}
            >☰</button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1.5 rounded text-sm border-none cursor-pointer transition-colors ${
                viewMode === "table" ? "bg-white/[0.08] text-white" : "bg-transparent text-slate-500"
              }`}
            >▤</button>
          </div>
        </div>
      </div>

      {/* Requests List / Table */}
      <div className="px-5 pb-[120px]">
        {viewMode === "table" ? (
          <RequestsTable requests={filtered} onSelectRequest={onSelectRequest} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No se encontraron solicitudes"
            description="Intenta cambiar los filtros o crea una nueva solicitud"
          />
        ) : (
          filtered.map(r => (
            <RequestCard key={r.id} request={r} onClick={() => onSelectRequest(r)} usdRate={usdRate} />
          ))
        )}
      </div>
    </div>
  );
}

function CounterCard({ label, value, color, icon, small }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
      <div className="text-sm mb-1">{icon}</div>
      <div className={`${small ? 'text-[11px]' : 'text-xl'} font-bold ${color} leading-tight`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{label}</div>
    </div>
  );
}

function FilterPill({ active, onClick, label, activeColor }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
        active
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.06]'
      }`}
    >
      {label}
    </button>
  );
}
