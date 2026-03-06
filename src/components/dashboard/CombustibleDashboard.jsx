import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Fuel, DollarSign, Truck, BarChart3, AlertTriangle,
  FileText, Droplets, Gauge, Calendar,
} from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import { ESTABLECIMIENTOS_PROPIOS } from "../../constants/establecimientos";
import {
  getFuelKPIs,
  getFuelPurchases,
  getDispenseEvents,
  getFuelBalances,
  detectFuelAnomalies,
} from "../../lib/fuelService";

/* ── helpers ───────────────────────────────────────────────── */

function fmtNumber(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  return String(n);
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" });
}

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
          <span className="inline-block w-16 h-7 bg-white/[0.04] rounded animate-pulse" />
        ) : value}
      </div>
    </div>
  );
}

function PurchaseRow({ purchase }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="shrink-0"><FileText size={16} className="text-slate-500" /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {purchase.supplier?.name || "—"} — {fmtNumber(Number(purchase.quantity))} L {purchase.fuel_type}
        </div>
        <div className="text-[11px] text-slate-500">
          {fmtDate(purchase.purchase_date)}
          {purchase.invoice_number ? ` · Fact: ${purchase.invoice_number}` : ""}
          {purchase.unit_price ? ` · ${fmtNumber(Number(purchase.unit_price))} Gs/L` : ""}
        </div>
      </div>
      <div className="text-[12px] font-bold text-[#C8A03A]">
        {purchase.total_cost ? `${fmtNumber(Number(purchase.total_cost))} Gs` : "—"}
      </div>
    </div>
  );
}

function DispenseRow({ event }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="shrink-0"><Droplets size={16} className="text-slate-500" /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {event.vehicle?.plate || "Sin vehículo"} — {fmtNumber(Number(event.quantity))} L
        </div>
        <div className="text-[11px] text-slate-500">
          {fmtDate(event.dispense_date)} · {event.fuel_type || "diésel"}
          {event.operator_name ? ` · ${event.operator_name}` : ""}
        </div>
      </div>
      {event.vehicle?.vehicle_type && (
        <Badge variant="default" size="xs">
          {event.vehicle.vehicle_type}
        </Badge>
      )}
    </div>
  );
}

function AnomalyRow({ anomaly }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors bg-red-500/[0.03]">
      <span className="shrink-0"><AlertTriangle size={16} className="text-red-400" /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {anomaly.plate || "Vehículo"} — {fmtNumber(anomaly.quantity)} L ({anomaly.ratio}x promedio)
        </div>
        <div className="text-[11px] text-slate-500">
          {fmtDate(anomaly.date)} · Promedio: {fmtNumber(anomaly.average)} L
        </div>
      </div>
      <Badge variant="error" size="xs" dot>
        Anómalo
      </Badge>
    </div>
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

export default function CombustibleDashboard({ onNavigate }) {
  const [establecimiento, setEstablecimiento] = useState("todos");

  // Data state
  const [kpis, setKpis] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [dispenses, setDispenses] = useState([]);
  const [anomalies, setAnomalies] = useState([]);

  // Loading state
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [loadingDispenses, setLoadingDispenses] = useState(true);
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);

  const estId = useMemo(() => {
    return establecimiento === "todos" ? null : establecimiento;
  }, [establecimiento]);

  const fetchData = useCallback(async () => {
    setLoadingKpis(true);
    setLoadingPurchases(true);
    setLoadingDispenses(true);
    setLoadingAnomalies(true);

    const kpiPromise = getFuelKPIs(estId)
      .then(d => { setKpis(d); setLoadingKpis(false); })
      .catch(() => { setKpis(null); setLoadingKpis(false); });

    const purchasePromise = getFuelPurchases({ establishmentId: estId, limit: 10 })
      .then(d => { setPurchases(d); setLoadingPurchases(false); })
      .catch(() => { setPurchases([]); setLoadingPurchases(false); });

    const dispensePromise = getDispenseEvents({ establishmentId: estId, limit: 10 })
      .then(d => { setDispenses(d); setLoadingDispenses(false); })
      .catch(() => { setDispenses([]); setLoadingDispenses(false); });

    // Anomalies only when specific establishment is selected
    if (estId) {
      detectFuelAnomalies(estId, 30)
        .then(d => { setAnomalies(d); setLoadingAnomalies(false); })
        .catch(() => { setAnomalies([]); setLoadingAnomalies(false); });
    } else {
      setAnomalies([]);
      setLoadingAnomalies(false);
    }

    await Promise.allSettled([kpiPromise, purchasePromise, dispensePromise]);
  }, [estId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <PageHeader
          title="Combustible"
          subtitle="Compras, despachos y control de consumo"
        />
        <div className="flex items-center gap-1.5 px-5 sm:px-0">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden sm:inline">
            Establecimiento
          </span>
          <div className="relative">
            <select
              value={establecimiento}
              onChange={(e) => setEstablecimiento(e.target.value)}
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

      {/* KPI cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide px-5 sm:px-0">
        <KpiCard
          label="Consumo Mes (L)"
          value={fmtNumber(kpis?.monthlyLiters ?? 0)}
          icon={<Fuel size={18} />}
          color="#3b82f6"
          loading={loadingKpis}
        />
        <KpiCard
          label="Gasto Mes (Gs)"
          value={fmtNumber(kpis?.monthlySpend ?? 0)}
          icon={<DollarSign size={18} />}
          color="#C8A03A"
          loading={loadingKpis}
        />
        <KpiCard
          label="Despachos"
          value={kpis?.dispenseCount ?? 0}
          icon={<Truck size={18} />}
          color="#8b5cf6"
          loading={loadingKpis}
        />
        <KpiCard
          label="Precio/Lt (Gs)"
          value={fmtNumber(kpis?.avgPricePerLiter ?? 0)}
          icon={<BarChart3 size={18} />}
          color="#10b981"
          loading={loadingKpis}
        />
      </div>

      {/* Anomaly banner (if any) */}
      {anomalies.length > 0 && (
        <div className="mb-4 px-5 sm:px-0">
          <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-400" />
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wide">
                {anomalies.length} anomalía{anomalies.length > 1 ? "s" : ""} detectada{anomalies.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="divide-y divide-red-500/10 rounded-lg overflow-hidden">
              {anomalies.slice(0, 3).map((a, i) => (
                <AnomalyRow key={i} anomaly={a} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout: Purchases + Dispenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-5 sm:px-0">

        {/* Recent Purchases */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Compras Recientes
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {loadingPurchases ? (
              <SkeletonRows count={4} />
            ) : purchases.length > 0 ? (
              purchases.slice(0, 6).map(p => (
                <PurchaseRow key={p.id} purchase={p} />
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">Sin compras recientes</p>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Dispenses */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Despachos Recientes
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {loadingDispenses ? (
              <SkeletonRows count={4} />
            ) : dispenses.length > 0 ? (
              dispenses.slice(0, 6).map(d => (
                <DispenseRow key={d.id} event={d} />
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">Sin despachos recientes</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
