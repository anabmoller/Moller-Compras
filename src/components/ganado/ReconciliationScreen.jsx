import { useState, useEffect } from "react";
import {
  Shield, AlertTriangle, CheckCircle2, Clock, FileText,
  Database, BarChart3, Calendar, RefreshCw,
} from "lucide-react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import { ESTABLECIMIENTOS_PROPIOS } from "../../constants/establecimientos";
import {
  getReconciliationSnapshots, getDiscrepancyAlerts,
  getIngests,
} from "../../lib/reconciliationService";

/* ── helpers ───────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PY", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PY", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const SEVERITY_CONFIG = {
  low:    { label: "Baja", variant: "default", color: "#94a3b8" },
  medium: { label: "Media", variant: "warning", color: "#f59e0b" },
  high:   { label: "Alta", variant: "error", color: "#ef4444" },
  critical: { label: "Crítica", variant: "error", color: "#dc2626" },
};

const SOURCE_LABELS = {
  sap: "SAP",
  control_pasto: "Control Pasto",
  sigor: "SIGOR",
  siap: "SIAP",
  senacsa: "SENACSA",
  capataz: "Capataz",
  trutest: "TruTest",
};

/* ── Sub-components ─────────────────────────────────────────── */

function KpiCard({ label, value, icon, color, loading }) {
  return (
    <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-4 flex-1 min-w-[130px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: color || "#fff" }}>
        {loading ? (
          <span className="inline-block w-12 h-7 bg-white/[0.04] rounded animate-pulse" />
        ) : value}
      </div>
    </div>
  );
}

function AlertRow({ alert }) {
  const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
  return (
    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors ${
      alert.severity === "high" || alert.severity === "critical" ? "bg-red-500/[0.03]" : ""
    }`}>
      <span className="shrink-0 mt-0.5">
        <AlertTriangle size={16} style={{ color: sev.color }} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-white truncate">
            {alert.alert_type?.replace(/_/g, " ") || "Discrepancia"}
          </span>
          <Badge variant={sev.variant} size="xs" dot>{sev.label}</Badge>
          {alert.is_resolved && <Badge variant="success" size="xs">Resuelto</Badge>}
        </div>
        <div className="text-[11px] text-slate-500">
          {fmtDateTime(alert.created_at)}
          {alert.establishment_id ? ` · ${alert.establishment_id}` : ""}
        </div>
        {alert.description && (
          <div className="text-[11px] text-slate-400 mt-0.5">{alert.description}</div>
        )}
        {alert.expected_value != null && alert.actual_value != null && (
          <div className="text-[10px] text-slate-500 mt-1 flex gap-4">
            <span>Esperado: <strong className="text-white">{alert.expected_value}</strong></span>
            <span>Actual: <strong className={alert.actual_value !== alert.expected_value ? "text-red-400" : "text-white"}>{alert.actual_value}</strong></span>
            <span>Diferencia: <strong className="text-amber-400">{Math.abs(alert.actual_value - alert.expected_value)}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

function SnapshotRow({ snapshot }) {
  const match = snapshot.match_pct != null;
  const matchColor = match
    ? snapshot.match_pct >= 99 ? "#10b981" : snapshot.match_pct >= 95 ? "#f59e0b" : "#ef4444"
    : "#94a3b8";

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="shrink-0"><Database size={16} className="text-slate-500" /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {fmtDate(snapshot.snapshot_date)} · {snapshot.establishment_id || "Global"}
        </div>
        <div className="text-[11px] text-slate-500">
          SIGAM: {snapshot.sigam_count ?? "—"} · Externo: {snapshot.external_count ?? "—"}
          {snapshot.discrepancies > 0 ? ` · ${snapshot.discrepancies} discrepancias` : ""}
        </div>
      </div>
      {match && (
        <div className="text-[14px] font-bold" style={{ color: matchColor }}>
          {snapshot.match_pct.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

function IngestRow({ ingest }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="shrink-0"><FileText size={16} className="text-slate-500" /></span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {SOURCE_LABELS[ingest.source_system] || ingest.source_system} — {ingest.document_type || "documento"}
        </div>
        <div className="text-[11px] text-slate-500">
          {fmtDateTime(ingest.ingested_at)}
          {ingest.record_count ? ` · ${ingest.record_count} registros` : ""}
          {ingest.status ? ` · ${ingest.status}` : ""}
        </div>
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

export default function ReconciliationScreen({ onBack }) {
  const [establecimiento, setEstablecimiento] = useState("todos");
  const [alerts, setAlerts] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [ingests, setIngests] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [loadingIngests, setLoadingIngests] = useState(true);

  const estId = establecimiento === "todos" ? null : establecimiento;

  useEffect(() => {
    setLoadingAlerts(true);
    setLoadingSnapshots(true);
    setLoadingIngests(true);

    getDiscrepancyAlerts({ establishmentId: estId, limit: 15 })
      .then(d => { setAlerts(d); setLoadingAlerts(false); })
      .catch(() => { setAlerts([]); setLoadingAlerts(false); });

    getReconciliationSnapshots({ establishmentId: estId, limit: 10 })
      .then(d => { setSnapshots(d); setLoadingSnapshots(false); })
      .catch(() => { setSnapshots([]); setLoadingSnapshots(false); });

    getIngests({ limit: 10 })
      .then(d => { setIngests(d); setLoadingIngests(false); })
      .catch(() => { setIngests([]); setLoadingIngests(false); });
  }, [estId]);

  const unresolvedAlerts = alerts.filter(a => !a.is_resolved).length;
  const criticalAlerts = alerts.filter(a => (a.severity === "high" || a.severity === "critical") && !a.is_resolved).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <PageHeader
          title="Conciliación"
          subtitle="Verificación cruzada SAP / Control Pasto / SIGOR / SIGAM"
          onBack={onBack}
        />
        <div className="flex items-center gap-1.5 px-5 sm:px-0">
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

      {/* KPIs */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide px-5 sm:px-0">
        <KpiCard label="Alertas Abiertas" value={unresolvedAlerts} icon={<AlertTriangle size={18} />} color={unresolvedAlerts > 0 ? "#ef4444" : "#10b981"} loading={loadingAlerts} />
        <KpiCard label="Críticas" value={criticalAlerts} icon={<Shield size={18} />} color={criticalAlerts > 0 ? "#dc2626" : "#10b981"} loading={loadingAlerts} />
        <KpiCard label="Snapshots" value={snapshots.length} icon={<Database size={18} />} color="#3b82f6" loading={loadingSnapshots} />
        <KpiCard label="Ingestas" value={ingests.length} icon={<FileText size={18} />} color="#8b5cf6" loading={loadingIngests} />
      </div>

      {/* Alerts */}
      <div className="mb-4 px-5 sm:px-0">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
          Alertas de Discrepancia
        </div>
        <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
          {loadingAlerts ? <SkeletonRows count={4} /> :
            alerts.length > 0 ? alerts.map(a => <AlertRow key={a.id} alert={a} />) : (
              <div className="p-8 text-center">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Sin discrepancias detectadas</p>
                <p className="text-xs text-slate-600 mt-1">El sistema está reconciliado</p>
              </div>
            )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-5 sm:px-0">
        {/* Snapshots */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Snapshots de Conciliación
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {loadingSnapshots ? <SkeletonRows count={3} /> :
              snapshots.length > 0 ? snapshots.map(s => <SnapshotRow key={s.id} snapshot={s} />) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-500">Sin snapshots</p>
                </div>
              )}
          </Card>
        </div>

        {/* External ingests */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Ingestas Externas
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {loadingIngests ? <SkeletonRows count={3} /> :
              ingests.length > 0 ? ingests.map(i => <IngestRow key={i.id} ingest={i} />) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-500">Sin ingestas recientes</p>
                </div>
              )}
          </Card>
        </div>
      </div>
    </div>
  );
}
