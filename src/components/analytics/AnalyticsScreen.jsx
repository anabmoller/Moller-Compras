import { useState, useMemo, lazy, Suspense } from "react";
import { PRIORITY_LEVELS } from "../../constants";
import { formatGuaranies, getBudgets } from "../../constants/budgets";
import KPICard from "../common/KPICard";

const StrategicAnalysis = lazy(() => import("../analysis/AnalysisScreen.jsx"));

const TABS = [
  { key: "overview", label: "Vision General", icon: "📊" },
  { key: "purchases", label: "Compras", icon: "💰" },
  { key: "budgets", label: "Presupuestos", icon: "📋" },
];

const SECTIONS = [
  { key: "operational", label: "Operativo", icon: "📊" },
  { key: "strategic", label: "Estratégico Pro", icon: "📈" },
];

export default function AnalyticsScreen({ requests, statusCounts, onBack, defaultSection = "operational" }) {
  const [section, setSection] = useState(defaultSection);
  const [tab, setTab] = useState("overview");

  const stats = useMemo(() => {
    const totalAmount = requests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const pendingCount = requests.filter(r =>
      ["borrador", "pend_autorizacion", "en_cotizacion", "pend_aprobacion",
       "cotizacion", "presupuestado", "pendiente_aprobacion", "pendiente"].includes(r.status)
    ).length;
    const completedCount = requests.filter(r => r.status === "sap" || r.status === "registrado_sap").length;
    const emergencyCount = requests.filter(r => (r.priority || r.urgency) === "emergencial").length;
    const avgAmount = requests.length > 0 ? totalAmount / requests.length : 0;

    const byEstablishment = {};
    requests.forEach(r => {
      if (!byEstablishment[r.establishment]) byEstablishment[r.establishment] = { count: 0, amount: 0 };
      byEstablishment[r.establishment].count++;
      byEstablishment[r.establishment].amount += r.totalAmount || 0;
    });

    const bySector = {};
    requests.forEach(r => {
      const sec = r.sector || "Sin sector";
      if (!bySector[sec]) bySector[sec] = { count: 0, amount: 0 };
      bySector[sec].count++;
      bySector[sec].amount += r.totalAmount || 0;
    });

    const byType = {};
    requests.forEach(r => {
      const t = r.type || "Sin tipo";
      if (!byType[t]) byType[t] = { count: 0, amount: 0 };
      byType[t].count++;
      byType[t].amount += r.totalAmount || 0;
    });

    const byUrgency = {};
    requests.forEach(r => {
      const prio = r.priority || r.urgency || "media";
      byUrgency[prio] = (byUrgency[prio] || 0) + 1;
    });

    const byMonth = {};
    requests.forEach(r => {
      if (r.date) {
        const month = r.date.substring(0, 7);
        if (!byMonth[month]) byMonth[month] = { count: 0, amount: 0 };
        byMonth[month].count++;
        byMonth[month].amount += r.totalAmount || 0;
      }
    });

    const byRequester = {};
    requests.forEach(r => {
      if (r.requester) {
        if (!byRequester[r.requester]) byRequester[r.requester] = { count: 0, amount: 0 };
        byRequester[r.requester].count++;
        byRequester[r.requester].amount += r.totalAmount || 0;
      }
    });

    return { totalAmount, pendingCount, completedCount, emergencyCount, avgAmount, byEstablishment, bySector, byType, byUrgency, byMonth, byRequester };
  }, [requests]);

  return (
    <div className="animate-fade-in">
      <div className="py-3 px-5">
        <button onClick={onBack} className="bg-transparent border-none cursor-pointer text-sm text-emerald-400 font-medium p-0">
          ← Volver
        </button>
      </div>

      <div className="px-5 pb-2">
        <h2 className="text-[22px] font-semibold text-white m-0 mb-1">
          Análisis y Reportes
        </h2>
        <div className="text-sm text-slate-400 mb-3">
          {requests.length} solicitudes · {formatGuaranies(stats.totalAmount)} total
        </div>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-1 px-5 pb-3">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              section === s.key
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-white/[0.02] text-slate-500 border-white/[0.06] hover:bg-white/[0.05]'
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {section === "strategic" ? (
        <Suspense fallback={<div className="flex justify-center py-10"><div className="text-slate-400 text-sm">Cargando...</div></div>}>
          <StrategicAnalysis embedded />
        </Suspense>
      ) : (
        <>
          {/* Tab Bar */}
          <div className="flex gap-1 px-5 pb-4 overflow-x-auto scrollbar-none">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 px-3 py-2.5 rounded-lg border-none text-xs font-semibold cursor-pointer transition-all ${
                  tab === t.key
                    ? 'bg-emerald-500/15 text-emerald-400 shadow-md'
                    : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="px-5 pb-[120px]">
            {tab === "overview" && <OverviewTab stats={stats} requests={requests} statusCounts={statusCounts} />}
            {tab === "purchases" && <PurchasesTab stats={stats} />}
            {tab === "budgets" && <BudgetsTab />}
          </div>
        </>
      )}
    </div>
  );
}

function OverviewTab({ stats, requests, statusCounts }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <KPICard label="Total Solicitudes" value={requests.length} color="#10b981" />
        <KPICard label="Pendientes" value={stats.pendingCount} color={stats.pendingCount > 5 ? "#ef4444" : "#f59e0b"} />
        <KPICard label="Completadas" value={stats.completedCount} color="#10b981" />
        <KPICard label="Emergencias" value={stats.emergencyCount} color="#ef4444" />
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 mb-4 text-white">
        <div className="text-[11px] opacity-70 uppercase tracking-widest mb-1">Monto Total Gestionado</div>
        <div className="text-[28px] font-bold">{formatGuaranies(stats.totalAmount)}</div>
        <div className="text-xs opacity-70 mt-1">Promedio por solicitud: {formatGuaranies(stats.avgAmount)}</div>
      </div>

      <AnalyticsCard title="Pipeline de Compras">
        {statusCounts.map(s => (
          <div key={s.key} className="flex items-center gap-2.5 mb-2.5">
            <span className="text-sm w-5.5 text-center">{s.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between mb-0.5">
                <span className="text-xs text-white">{s.label}</span>
                <span className="text-xs font-semibold" style={{ color: s.color }}>{s.count}</span>
              </div>
              <ProgressBar value={s.count} max={Math.max(...statusCounts.map(x => x.count), 1)} color={s.color} />
            </div>
          </div>
        ))}
      </AnalyticsCard>

      <AnalyticsCard title="Por Prioridad">
        {PRIORITY_LEVELS.map(u => (
          <div key={u.value} className="flex justify-between items-center py-2 border-b border-white/[0.06]">
            <span className="text-sm text-white">{u.icon} {u.label}</span>
            <span className="text-sm font-semibold" style={{ color: u.color }}>{stats.byUrgency[u.value] || 0}</span>
          </div>
        ))}
      </AnalyticsCard>
    </>
  );
}

function PurchasesTab({ stats }) {
  const [sortBy, setSortBy] = useState("amount");

  const estEntries = Object.entries(stats.byEstablishment)
    .sort((a, b) => sortBy === "amount" ? b[1].amount - a[1].amount : b[1].count - a[1].count);
  const secEntries = Object.entries(stats.bySector).sort((a, b) => b[1].amount - a[1].amount);
  const typeEntries = Object.entries(stats.byType).sort((a, b) => b[1].amount - a[1].amount);
  const reqEntries = Object.entries(stats.byRequester).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
  const monthEntries = Object.entries(stats.byMonth).sort((a, b) => a[0].localeCompare(b[0]));

  const maxEstAmount = Math.max(...estEntries.map(([, v]) => v.amount), 1);
  const maxSecAmount = Math.max(...secEntries.map(([, v]) => v.amount), 1);

  return (
    <>
      <AnalyticsCard title="Compras por Establecimiento" action={
        <button
          onClick={() => setSortBy(sortBy === "amount" ? "count" : "amount")}
          className="bg-transparent border-none text-[11px] text-emerald-400 cursor-pointer font-medium"
        >
          Por {sortBy === "amount" ? "cantidad" : "monto"}
        </button>
      }>
        {estEntries.map(([est, data]) => (
          <div key={est} className="mb-2.5">
            <div className="flex justify-between mb-0.5">
              <span className="text-xs text-white">📍 {est}</span>
              <div className="flex gap-3">
                <span className="text-[11px] text-slate-400">{data.count} sol.</span>
                <span className="text-xs font-semibold text-emerald-400">{formatGuaranies(data.amount)}</span>
              </div>
            </div>
            <ProgressBar value={data.amount} max={maxEstAmount} color="#10b981" />
          </div>
        ))}
      </AnalyticsCard>

      <AnalyticsCard title="Compras por Sector">
        {secEntries.map(([sec, data]) => (
          <div key={sec} className="mb-2.5">
            <div className="flex justify-between mb-0.5">
              <span className="text-xs text-white">{sec}</span>
              <span className="text-xs font-semibold text-amber-400">{formatGuaranies(data.amount)}</span>
            </div>
            <ProgressBar value={data.amount} max={maxSecAmount} color="#f59e0b" />
          </div>
        ))}
      </AnalyticsCard>

      <AnalyticsCard title="Por Tipo de Producto">
        {typeEntries.map(([type, data]) => (
          <div key={type} className="flex justify-between items-center py-2 border-b border-white/[0.06]">
            <span className="text-xs text-white">{type}</span>
            <div className="text-right">
              <div className="text-xs font-semibold text-emerald-400">{formatGuaranies(data.amount)}</div>
              <div className="text-[10px] text-slate-500">{data.count} solicitudes</div>
            </div>
          </div>
        ))}
      </AnalyticsCard>

      {monthEntries.length > 0 && (
        <AnalyticsCard title="Tendencia Mensual">
          {monthEntries.map(([month, data]) => {
            const maxM = Math.max(...monthEntries.map(([, v]) => v.amount), 1);
            const monthLabel = new Date(month + "-01").toLocaleDateString("es-PY", { month: "short", year: "numeric" });
            return (
              <div key={month} className="mb-2.5">
                <div className="flex justify-between mb-0.5">
                  <span className="text-xs text-white capitalize">{monthLabel}</span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {formatGuaranies(data.amount)} ({data.count})
                  </span>
                </div>
                <ProgressBar value={data.amount} max={maxM} color="#10b981" />
              </div>
            );
          })}
        </AnalyticsCard>
      )}

      <AnalyticsCard title="Top Solicitantes">
        {reqEntries.map(([name, data], i) => (
          <div key={name} className="flex items-center gap-2.5 py-2 border-b border-white/[0.06]">
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-white ${i < 3 ? 'bg-emerald-600' : 'bg-slate-600'}`}>
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-emerald-400">{data.count}</div>
              <div className="text-[10px] text-slate-500">{formatGuaranies(data.amount)}</div>
            </div>
          </div>
        ))}
      </AnalyticsCard>
    </>
  );
}

function BudgetsTab() {
  const budgets = getBudgets().filter(b => b.active);
  const totalPlanned = budgets.reduce((s, b) => s + b.planned, 0);
  const totalConsumed = budgets.reduce((s, b) => s + b.consumed, 0);
  const overallPct = totalPlanned > 0 ? Math.round((totalConsumed / totalPlanned) * 100) : 0;

  const byEst = {};
  budgets.forEach(b => {
    if (!byEst[b.establishment]) byEst[b.establishment] = [];
    byEst[b.establishment].push(b);
  });

  return (
    <>
      <div className={`bg-gradient-to-br ${overallPct > 80 ? 'from-red-600 to-red-800' : 'from-emerald-600 to-emerald-800'} rounded-2xl p-5 mb-4 text-white`}>
        <div className="text-[11px] opacity-70 uppercase tracking-widest mb-1">Presupuesto Global 2026</div>
        <div className="flex justify-between items-baseline">
          <div className="text-2xl font-bold">{overallPct}%</div>
          <div className="text-xs opacity-80">{formatGuaranies(totalConsumed)} / {formatGuaranies(totalPlanned)}</div>
        </div>
        <div className="h-1.5 rounded-full bg-white/20 mt-3">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${Math.min(overallPct, 100)}%` }}
          />
        </div>
        <div className="text-[11px] opacity-70 mt-2">Disponible: {formatGuaranies(totalPlanned - totalConsumed)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <KPICard label="Presupuestos Activos" value={budgets.length} color="#10b981" />
        <KPICard label="Sobre 80%" value={budgets.filter(b => (b.consumed / b.planned) * 100 > 80).length} color="#ef4444" />
      </div>

      {Object.entries(byEst).sort((a, b) => a[0].localeCompare(b[0])).map(([est, estBudgets]) => {
        const estPlanned = estBudgets.reduce((s, b) => s + b.planned, 0);
        const estConsumed = estBudgets.reduce((s, b) => s + b.consumed, 0);
        const estPct = estPlanned > 0 ? Math.round((estConsumed / estPlanned) * 100) : 0;

        return (
          <AnalyticsCard key={est} title={`📍 ${est}`} subtitle={`${estPct}% ejecutado`}>
            {estBudgets.map(b => {
              const pct = b.planned > 0 ? Math.round((b.consumed / b.planned) * 100) : 0;
              const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981';
              return (
                <div key={b.id} className="mb-3">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs font-medium text-white">{b.sector}</span>
                    <span className="text-[11px] font-semibold" style={{ color: barColor }}>{pct}%</span>
                  </div>
                  <ProgressBar value={b.consumed} max={b.planned} color={barColor} height={6} />
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-slate-500">{formatGuaranies(b.consumed)}</span>
                    <span className="text-[10px] text-slate-500">{formatGuaranies(b.planned)}</span>
                  </div>
                </div>
              );
            })}
          </AnalyticsCard>
        );
      })}
    </>
  );
}

function AnalyticsCard({ title, subtitle, action, children }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mb-3">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</div>
          {subtitle && <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ value, max, color, height = 4 }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="rounded-full bg-white/[0.08]" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ background: color, width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}
