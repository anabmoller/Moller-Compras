import { useState, useEffect, useCallback } from "react";
import {
  Truck, MapPin, Clock, CheckCircle2, AlertTriangle,
  BarChart3, Calendar, ChevronRight, Package,
} from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import { getFreightJobs, getCarriers } from "../../lib/freightService";

/* ── helpers ───────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" });
}

function fmtNumber(n) {
  if (n == null) return "—";
  return String(Math.round(n * 100) / 100);
}

const STATUS_MAP = {
  scheduled:  { label: "Programado", variant: "default" },
  loaded:     { label: "Cargado", variant: "info" },
  in_transit: { label: "En tránsito", variant: "warning" },
  arrived:    { label: "Llegado", variant: "info" },
  unloaded:   { label: "Descargado", variant: "success" },
  completed:  { label: "Completado", variant: "success" },
  cancelled:  { label: "Cancelado", variant: "error" },
};

const CARGO_TYPE_LABELS = {
  cattle: "Ganado",
  raw_material: "Materia Prima",
  fuel: "Combustible",
  general: "General",
};

/* ── Sub-components ─────────────────────────────────────────── */

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

function JobRow({ job }) {
  const s = STATUS_MAP[job.status] || { label: job.status, variant: "default" };
  const hasLoss = job.loss_quantity > 0;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors ${
      hasLoss ? "bg-red-500/[0.03]" : ""
    }`}>
      <span className="shrink-0">
        <Truck size={16} className={hasLoss ? "text-red-400" : "text-slate-500"} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-white truncate">
            {job.carrier?.name || "Sin transportista"} — {job.expected_quantity || 0} {job.cargo_type === "cattle" ? "cab." : "u."}
          </span>
          <Badge variant={s.variant} size="xs">{s.label}</Badge>
          {job.cargo_type && (
            <Badge variant="default" size="xs">
              {CARGO_TYPE_LABELS[job.cargo_type] || job.cargo_type}
            </Badge>
          )}
        </div>
        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3">
          <span className="flex items-center gap-1">
            <Calendar size={10} /> {fmtDate(job.scheduled_pickup)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={10} /> {job.origin || "—"} → {job.destination || "—"}
          </span>
          {hasLoss && (
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <AlertTriangle size={10} /> Pérdida: {job.loss_quantity}
            </span>
          )}
        </div>
      </div>
      {job.actual_cost && (
        <div className="text-[12px] font-bold text-[#C8A03A]">
          US$ {fmtNumber(job.actual_cost)}
        </div>
      )}
    </div>
  );
}

function CarrierCard({ carrier }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center shrink-0">
          <Truck size={18} className="text-[#3b82f6]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-white truncate">{carrier.name}</div>
          <div className="text-[11px] text-slate-500">
            {carrier.contact_phone || carrier.contact_email || "Sin contacto"}
            {carrier.ruc ? ` · RUC: ${carrier.ruc}` : ""}
          </div>
        </div>
        {carrier.is_active && <Badge variant="success" size="xs" dot>Activo</Badge>}
      </div>
    </Card>
  );
}

function SkeletonRows({ count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="flex items-center gap-3 px-4 py-3">
      <span className="w-4 h-4 bg-white/[0.04] rounded animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <span className="block w-3/4 h-3 bg-white/[0.04] rounded animate-pulse" />
        <span className="block w-1/2 h-2.5 bg-white/[0.04] rounded animate-pulse" />
      </div>
    </div>
  ));
}

/* ── Main component ─────────────────────────────────────────── */

export default function FreightScreen({ onBack }) {
  const [jobs, setJobs] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCarriers, setLoadingCarriers] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCargo, setFilterCargo] = useState("all");

  useEffect(() => {
    const filters = { limit: 30 };
    if (filterStatus !== "all") filters.status = filterStatus;
    if (filterCargo !== "all") filters.cargoType = filterCargo;

    setLoadingJobs(true);
    getFreightJobs(filters)
      .then(d => { setJobs(d); setLoadingJobs(false); })
      .catch(() => { setJobs([]); setLoadingJobs(false); });
  }, [filterStatus, filterCargo]);

  useEffect(() => {
    getCarriers(true)
      .then(d => { setCarriers(d); setLoadingCarriers(false); })
      .catch(() => { setCarriers([]); setLoadingCarriers(false); });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      <PageHeader
        title="Flete & Transporte"
        subtitle="Trabajos de flete, transportistas y rendimiento"
        onBack={onBack}
      />

      {/* Filter pills */}
      <div className="mt-5 mb-4 px-5 sm:px-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
          <FilterPill label="Todos" active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
          <FilterPill label="Programados" active={filterStatus === "scheduled"} onClick={() => setFilterStatus("scheduled")} />
          <FilterPill label="En Tránsito" active={filterStatus === "in_transit"} onClick={() => setFilterStatus("in_transit")} />
          <FilterPill label="Completados" active={filterStatus === "completed"} onClick={() => setFilterStatus("completed")} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <FilterPill label="Todo Tipo" active={filterCargo === "all"} onClick={() => setFilterCargo("all")} />
          <FilterPill label="Ganado" active={filterCargo === "cattle"} onClick={() => setFilterCargo("cattle")} />
          <FilterPill label="Materia Prima" active={filterCargo === "raw_material"} onClick={() => setFilterCargo("raw_material")} />
          <FilterPill label="Combustible" active={filterCargo === "fuel"} onClick={() => setFilterCargo("fuel")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-5 sm:px-0">
        {/* Jobs list (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Trabajos de Flete
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {loadingJobs ? <SkeletonRows count={5} /> :
              jobs.length > 0 ? jobs.map(j => <JobRow key={j.id} job={j} />) : (
                <div className="p-8 text-center">
                  <Truck size={32} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Sin trabajos de flete</p>
                </div>
              )}
          </Card>
        </div>

        {/* Carriers sidebar */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Transportistas
          </div>
          <div className="space-y-2">
            {loadingCarriers ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 bg-white/[0.04] rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <span className="block w-2/3 h-3 bg-white/[0.04] rounded animate-pulse" />
                      <span className="block w-1/2 h-2.5 bg-white/[0.04] rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))
            ) : carriers.length > 0 ? (
              carriers.map(c => <CarrierCard key={c.id} carrier={c} />)
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">Sin transportistas registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
