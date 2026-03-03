import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { hasPermission } from "../../constants/users";
import { getEstablishments } from "../../constants/parameters";
import {
  GANADO_STATUS_FLOW, GANADO_EXTRA_STATUSES,
  TIPO_OPERACION_OPTIONS,
  fetchMovimientos,
} from "../../constants/ganado";
import PageHeader from "../common/PageHeader";
import SearchInput from "../common/SearchInput";
import MovimientoCard from "./MovimientoCard";

function FilterPill({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-[5px] rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
        active
          ? "bg-[#1F2A44]/10 text-[#C8A03A] border-2 border-[#C8A03A]"
          : "bg-[#F8F9FB]/[0.03] text-slate-400 border border-white/[0.06] hover:bg-[#F8F9FB]/[0.06]"
      }`}
    >
      {label}
    </button>
  );
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-4 flex-1 min-w-[140px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: color || "#fff" }}>{value}</div>
    </div>
  );
}

export default function MovimientosScreen({ onBack, onNavigate }) {
  const { currentUser } = useAuth();
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEstablishment, setFilterEstablishment] = useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchMovimientos();
      setMovimientos(data);
      setLoading(false);
    }
    load();
  }, []);

  // KPI calculations
  const kpis = useMemo(() => {
    const porValidar = movimientos.filter(m => m.estado === "borrador" || m.estado === "pendiente_validacion").length;
    const enTransito = movimientos.filter(m => m.estado === "en_transito").length;
    const totalCabezas = movimientos.reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const totalGs = movimientos
      .filter(m => m.moneda === "PYG" && m.estado !== "anulado")
      .reduce((sum, m) => sum + (m.precioTotal || 0), 0);
    return { porValidar, enTransito, totalCabezas, totalGs };
  }, [movimientos]);

  // Status counts for pills
  const statusCounts = useMemo(() => {
    const all = [...GANADO_STATUS_FLOW, ...GANADO_EXTRA_STATUSES];
    return all.map(s => ({
      ...s,
      count: movimientos.filter(m => m.estado === s.key).length,
    }));
  }, [movimientos]);

  // Filtered
  const filtered = useMemo(() => {
    return movimientos.filter(m => {
      if (filterStatus !== "all" && m.estado !== filterStatus) return false;
      if (filterEstablishment !== "all" && m.establecimientoOrigenId !== filterEstablishment) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !m.id?.toLowerCase().includes(q) &&
          !m.nroGuia?.toLowerCase().includes(q) &&
          !m.nroCota?.toLowerCase().includes(q) &&
          !m.createdBy?.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [movimientos, filterStatus, filterEstablishment, search]);

  const establishments = getEstablishments();
  const canCreate = hasPermission(currentUser, "create_movimiento_ganado");

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageHeader
        title="Movimientos de Ganado"
        subtitle={`${movimientos.length} movimientos registrados`}
        onBack={onBack}
      />

      {/* KPI cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <KpiCard label="Por Validar" value={kpis.porValidar} icon="⏳" color="#f59e0b" />
        <KpiCard label="En Tránsito" value={kpis.enTransito} icon="🚚" color="#8b5cf6" />
        <KpiCard label="Total Cabezas" value={kpis.totalCabezas.toLocaleString("es-PY")} icon="🐄" color="#3b82f6" />
        <KpiCard
          label="Total Gs."
          value={`Gs. ${kpis.totalGs.toLocaleString("es-PY")}`}
          icon="💰"
          color="#C8A03A"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nro, guía, COTA..."
        />
        <select
          value={filterEstablishment}
          onChange={(e) => setFilterEstablishment(e.target.value)}
          className="bg-[#13141a] border border-white/[0.06] text-slate-300 text-xs rounded-lg px-3 py-2 min-w-[160px]"
        >
          <option value="all">Todos los establecimientos</option>
          {establishments.map(e => (
            <option key={e._uuid} value={e._uuid}>{e.name}</option>
          ))}
        </select>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <FilterPill label={`Todos (${movimientos.length})`} active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
        {statusCounts.filter(s => s.count > 0).map(s => (
          <FilterPill
            key={s.key}
            label={`${s.icon} ${s.label} (${s.count})`}
            active={filterStatus === s.key}
            onClick={() => setFilterStatus(s.key)}
            color={s.color}
          />
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 rounded-lg bg-[#1F2A44] inline-flex items-center justify-center shadow-lg shadow-black/20 animate-pulse mb-3">
            <span className="text-white text-sm font-bold">🐄</span>
          </div>
          <p className="text-slate-500 text-sm">Cargando movimientos...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🐄</div>
          <p className="text-slate-400 text-sm mb-1">No hay movimientos registrados</p>
          <p className="text-slate-600 text-xs">
            {canCreate ? "Crea el primer movimiento de ganado" : "Contacta al administrador"}
          </p>
        </div>
      )}

      {/* Movimiento cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(m => (
            <MovimientoCard
              key={m._uuid}
              movimiento={m}
              onClick={() => onNavigate("ganado-detail", m._uuid)}
            />
          ))}
        </div>
      )}

      {/* FAB for new movimiento */}
      {canCreate && (
        <button
          onClick={() => onNavigate("ganado-new")}
          className="fixed bottom-20 right-5 sm:bottom-8 sm:right-8 w-14 h-14 rounded-full bg-[#C8A03A] text-white text-2xl font-bold shadow-lg shadow-[#C8A03A]/20 hover:bg-[#b8922f] transition-colors flex items-center justify-center z-40"
          title="Nuevo Movimiento"
        >
          +
        </button>
      )}
    </div>
  );
}
