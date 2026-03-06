import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package, AlertTriangle, Scale, DollarSign, Building2,
  CheckCircle2, ClipboardList, TrendingUp, Plus, ChevronRight,
  Warehouse, ArrowDownToLine, FileText,
} from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import { ESTABLECIMIENTOS_PROPIOS } from "../../constants/establecimientos";
import {
  getRawMaterialsKPIs,
  getContracts,
  getDeliveries,
  getInventoryBalances,
} from "../../lib/rawMaterialsService";

/* ── helpers ───────────────────────────────────────────────── */

function fmtNumber(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" });
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Hace 1 día";
  return `Hace ${days} días`;
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

function ContractRow({ contract }) {
  const pct = contract.total_quantity > 0
    ? Math.round((Number(contract.delivered_quantity || 0) / Number(contract.total_quantity)) * 100)
    : 0;
  const statusColor = contract.status === "active" ? "success" : contract.status === "completed" ? "default" : "warning";

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="shrink-0"><FileText size={16} className="text-slate-500" /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {contract.commodity?.name || "—"} — {contract.supplier?.name || "—"}
        </div>
        <div className="text-[11px] text-slate-500">
          {contract.contract_number} · {fmtNumber(Number(contract.total_quantity))} {contract.unit} · {pct}% entregado
        </div>
      </div>
      <Badge variant={statusColor} size="xs" dot>
        {contract.status === "active" ? "Activo" : contract.status === "completed" ? "Completo" : contract.status}
      </Badge>
    </div>
  );
}

function DeliveryRow({ delivery }) {
  const statusMap = {
    received: { label: "Recibido", variant: "info" },
    verified: { label: "Verificado", variant: "success" },
    rejected: { label: "Rechazado", variant: "error" },
    in_transit: { label: "En tránsito", variant: "warning" },
  };
  const s = statusMap[delivery.status] || { label: delivery.status, variant: "default" };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="shrink-0"><ArrowDownToLine size={16} className="text-slate-500" /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {delivery.commodity?.name || "—"} — {fmtNumber(Number(delivery.received_quantity))} {delivery.unit}
        </div>
        <div className="text-[11px] text-slate-500">
          {delivery.supplier?.name || "—"} · {fmtDate(delivery.delivery_date)}
          {delivery.remission_number ? ` · Rem: ${delivery.remission_number}` : ""}
        </div>
      </div>
      <Badge variant={s.variant} size="xs" dot>
        {s.label}
      </Badge>
    </div>
  );
}

function InventoryRow({ item }) {
  const coverColor = item.days_of_coverage < 7 ? "text-red-400" : item.days_of_coverage < 14 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="shrink-0"><Warehouse size={16} className="text-slate-500" /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {item.commodity?.name || "—"}
        </div>
        <div className="text-[11px] text-slate-500">
          {fmtNumber(Number(item.current_balance))} {item.unit} en stock
        </div>
      </div>
      <div className={`text-[12px] font-bold ${coverColor}`}>
        {item.days_of_coverage != null ? `${Math.round(item.days_of_coverage)}d` : "—"}
      </div>
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

export default function MateriaPrimaDashboard({ onNavigate }) {
  const [establecimiento, setEstablecimiento] = useState("todos");

  // Data state
  const [kpis, setKpis] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Loading state
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);

  // Map establishment key → UUID (null for "todos")
  const estId = useMemo(() => {
    if (establecimiento === "todos") return null;
    // For now pass the key string; the DB uses UUID references
    // but the filter works via establishment_id column
    return establecimiento;
  }, [establecimiento]);

  // Fetch all data when establishment changes
  const fetchData = useCallback(async () => {
    setLoadingKpis(true);
    setLoadingContracts(true);
    setLoadingDeliveries(true);
    setLoadingInventory(true);

    // Fire all queries in parallel
    const kpiPromise = getRawMaterialsKPIs(estId)
      .then(d => { setKpis(d); setLoadingKpis(false); })
      .catch(() => { setKpis(null); setLoadingKpis(false); });

    const contractPromise = getContracts({ status: "active", establishmentId: estId })
      .then(d => { setContracts(d); setLoadingContracts(false); })
      .catch(() => { setContracts([]); setLoadingContracts(false); });

    const deliveryPromise = getDeliveries({ establishmentId: estId, limit: 10 })
      .then(d => { setDeliveries(d); setLoadingDeliveries(false); })
      .catch(() => { setDeliveries([]); setLoadingDeliveries(false); });

    const inventoryPromise = getInventoryBalances(estId)
      .then(d => { setInventory(d); setLoadingInventory(false); })
      .catch(() => { setInventory([]); setLoadingInventory(false); });

    await Promise.allSettled([kpiPromise, contractPromise, deliveryPromise, inventoryPromise]);
  }, [estId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sort inventory by coverage (lowest first)
  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => (a.days_of_coverage || 0) - (b.days_of_coverage || 0)).slice(0, 8);
  }, [inventory]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <PageHeader
          title="Materia Prima"
          subtitle="Contratos, entregas, inventario y proveedores"
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
          label="Contratos Activos"
          value={kpis?.activeContracts ?? 0}
          icon={<Package size={18} />}
          color="#3b82f6"
          loading={loadingKpis}
        />
        <KpiCard
          label="Alertas Stock"
          value={kpis?.lowStockAlerts ?? 0}
          icon={<AlertTriangle size={18} />}
          color={kpis?.lowStockAlerts > 0 ? "#f59e0b" : "#10b981"}
          loading={loadingKpis}
        />
        <KpiCard
          label="Toneladas Mes"
          value={fmtNumber(kpis?.totalTonnage ?? 0)}
          icon={<Scale size={18} />}
          color="#8b5cf6"
          loading={loadingKpis}
        />
        <KpiCard
          label="Gasto Mes (Gs)"
          value={fmtNumber(kpis?.totalSpend ?? 0)}
          icon={<DollarSign size={18} />}
          color="#C8A03A"
          loading={loadingKpis}
        />
      </div>

      {/* Three-column layout: Contracts / Deliveries / Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-5 sm:px-0">

        {/* Active Contracts */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Contratos Activos
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {loadingContracts ? (
              <SkeletonRows count={4} />
            ) : contracts.length > 0 ? (
              contracts.slice(0, 6).map(c => (
                <ContractRow key={c.id} contract={c} />
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">Sin contratos activos</p>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Deliveries */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Entregas Recientes
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {loadingDeliveries ? (
              <SkeletonRows count={4} />
            ) : deliveries.length > 0 ? (
              deliveries.slice(0, 6).map(d => (
                <DeliveryRow key={d.id} delivery={d} />
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">Sin entregas recientes</p>
              </div>
            )}
          </Card>
        </div>

        {/* Inventory Levels */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Stock — Cobertura (días)
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {loadingInventory ? (
              <SkeletonRows count={4} />
            ) : sortedInventory.length > 0 ? (
              sortedInventory.map(item => (
                <InventoryRow key={item.id} item={item} />
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">Sin datos de inventario</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
