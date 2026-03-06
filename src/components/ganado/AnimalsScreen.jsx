import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, Filter, Upload, ChevronRight, Scale, Calendar,
  Tag, MapPin, AlertTriangle, CheckCircle2, Clock,
  ShoppingCart, ArrowDownCircle, ArrowUpCircle, Skull,
} from "lucide-react";
import { BullIcon } from "../icons";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import SearchInput from "../common/SearchInput";
import { ESTABLECIMIENTOS_PROPIOS } from "../../constants/establecimientos";
import { getAnimals, getHaciendaKPIs, getBatches } from "../../lib/hacendaService";

/* ── helpers ───────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" });
}

function fmtWeight(w) {
  if (!w) return "—";
  return `${Number(w).toFixed(0)} kg`;
}

const STATUS_MAP = {
  active:    { label: "Activo", variant: "success" },
  sold:      { label: "Vendido", variant: "default" },
  dead:      { label: "Muerto", variant: "error" },
  slaughtered: { label: "Faenado", variant: "info" },
  transferred: { label: "Transferido", variant: "warning" },
};

const CATEGORY_LABELS = {
  toro: "Toro", vaca: "Vaca", novillo: "Novillo", vaquilla: "Vaquilla",
  ternero: "Ternero", ternera: "Ternera", torete: "Torete",
};

/* ── Sub-components ─────────────────────────────────────────── */

function KpiCard({ label, value, icon, color, loading }) {
  return (
    <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-4 flex-1 min-w-[140px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: color || "#fff" }}>
        {loading ? (
          <span className="inline-block w-14 h-7 bg-white/[0.04] rounded animate-pulse" />
        ) : value}
      </div>
    </div>
  );
}

function AnimalCard({ animal, onClick }) {
  const s = STATUS_MAP[animal.current_status] || { label: animal.current_status, variant: "default" };

  return (
    <Card onClick={onClick} className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#C8A03A]/10 flex items-center justify-center shrink-0">
          <BullIcon size={18} className="text-[#C8A03A]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-bold text-white truncate">
              {animal.trutest_id || animal.visual_tag || "Sin ID"}
            </span>
            <Badge variant={s.variant} size="xs" dot>{s.label}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-500">
            {animal.category && (
              <span className="flex items-center gap-1">
                <Tag size={10} /> {CATEGORY_LABELS[animal.category] || animal.category}
              </span>
            )}
            {animal.current_weight && (
              <span className="flex items-center gap-1">
                <Scale size={10} /> {fmtWeight(animal.current_weight)}
              </span>
            )}
            {animal.entry_date && (
              <span className="flex items-center gap-1">
                <Calendar size={10} /> {fmtDate(animal.entry_date)}
              </span>
            )}
          </div>
          {animal.visual_tag && animal.trutest_id && (
            <div className="text-[10px] text-slate-600 mt-0.5">
              Visual: {animal.visual_tag}
            </div>
          )}
        </div>
        <ChevronRight size={16} className="text-slate-600 shrink-0 mt-1" />
      </div>
    </Card>
  );
}

function FilterPill({ label, active, onClick }) {
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

/* ── Main component ─────────────────────────────────────────── */

export default function AnimalsScreen({ onBack, onNavigate }) {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterEstablishment, setFilterEstablishment] = useState("todos");

  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);

  const estId = filterEstablishment === "todos" ? null : filterEstablishment;

  // Fetch animals
  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnimals({
        status: filterStatus === "all" ? undefined : filterStatus,
        establishmentId: estId,
        search: search || undefined,
        limit: 200,
      });
      setAnimals(data);
    } catch (err) {
      console.error("[AnimalsScreen] fetch error:", err);
      setAnimals([]);
    }
    setLoading(false);
  }, [filterStatus, estId, search]);

  // Fetch KPIs
  useEffect(() => {
    setKpisLoading(true);
    getHaciendaKPIs(estId)
      .then(d => { setKpis(d); setKpisLoading(false); })
      .catch(() => { setKpis(null); setKpisLoading(false); });
  }, [estId]);

  useEffect(() => { fetchAnimals(); }, [fetchAnimals]);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { fetchAnimals(); }, [debouncedSearch]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <PageHeader
          title="Animales"
          subtitle="Trazabilidad operativa — desde la entrada al sistema"
          onBack={onBack}
        />
        <div className="flex items-center gap-2 px-5 sm:px-0">
          <button
            onClick={() => onNavigate?.("trutest-import")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8A03A]/10 text-[#C8A03A] text-[11px] font-bold hover:bg-[#C8A03A]/20 transition-colors"
          >
            <Upload size={14} /> TruTest
          </button>
          <div className="relative">
            <select
              value={filterEstablishment}
              onChange={(e) => setFilterEstablishment(e.target.value)}
              className="appearance-none bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-lg pl-3 pr-8 py-1.5 text-[11px] font-semibold text-slate-300 cursor-pointer hover:bg-[#F8F9FB]/[0.06] hover:border-white/[0.12] transition-colors focus:outline-none focus:border-[#C8A03A]/40"
            >
              <option value="todos">Todos</option>
              {ESTABLECIMIENTOS_PROPIOS.map((e) => (
                <option key={e.key} value={e.key}>{e.nombre}</option>
              ))}
            </select>
            <svg className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* KPIs — Purchase-centric: purchases, entries, exits, mortalities first */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-5 scrollbar-hide px-5 sm:px-0">
        <KpiCard label="Compras del Mes" value={kpis?.monthlyPurchases ?? 0} icon={<ShoppingCart size={18} />} color="#C8A03A" loading={kpisLoading} />
        <KpiCard label="Entradas Mes" value={kpis?.monthlyEntries ?? 0} icon={<ArrowDownCircle size={18} />} color="#10b981" loading={kpisLoading} />
        <KpiCard label="Animales Activos" value={kpis?.totalAnimals ?? 0} icon={<BullIcon size={18} />} color="#3b82f6" loading={kpisLoading} />
        <KpiCard label="Ventas Mes" value={kpis?.monthlySales ?? 0} icon={<ArrowUpCircle size={18} />} color="#8b5cf6" loading={kpisLoading} />
        <KpiCard label="Mortalidades" value={kpis?.totalMortalities ?? 0} icon={<Skull size={18} />} color={kpis?.totalMortalities > 0 ? "#ef4444" : "#10b981"} loading={kpisLoading} />
      </div>

      {/* Search + Status Filters */}
      <div className="px-5 sm:px-0 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por TruTest ID, caravana o SENACSA..."
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide px-5 sm:px-0">
        <FilterPill label="Activos" active={filterStatus === "active"} onClick={() => setFilterStatus("active")} />
        <FilterPill label="Todos" active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
        <FilterPill label="Vendidos" active={filterStatus === "sold"} onClick={() => setFilterStatus("sold")} />
        <FilterPill label="Faenados" active={filterStatus === "slaughtered"} onClick={() => setFilterStatus("slaughtered")} />
      </div>

      {/* Animal list */}
      <div className="space-y-2 px-5 sm:px-0">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 bg-white/[0.04] rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <span className="block w-1/3 h-3.5 bg-white/[0.04] rounded animate-pulse" />
                  <span className="block w-1/2 h-2.5 bg-white/[0.04] rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : animals.length > 0 ? (
          animals.map(a => (
            <AnimalCard
              key={a.id}
              animal={a}
              onClick={() => onNavigate?.("animal-detail", a.id)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <BullIcon size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {search ? "Sin resultados para la búsqueda" : "Sin animales registrados"}
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Importá un archivo TruTest CSV para comenzar
            </p>
          </div>
        )}
      </div>

      {/* Count footer */}
      {!loading && animals.length > 0 && (
        <div className="text-center mt-4 px-5 sm:px-0">
          <span className="text-[11px] text-slate-600">
            {animals.length} animal{animals.length !== 1 ? "es" : ""} mostrado{animals.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
