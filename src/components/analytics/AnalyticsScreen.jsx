import { useState, useMemo } from "react";
import { colors, font, fontDisplay, shadows, radius } from "../../styles/theme";
import { URGENCY_LEVELS, PRIORITY_LEVELS } from "../../constants";
import { formatGuaranies, getBudgets } from "../../constants/budgets";
import KPICard from "../common/KPICard";

const TABS = [
  { key: "overview", label: "Vision General", icon: "📊" },
  { key: "purchases", label: "Compras", icon: "💰" },
  { key: "budgets", label: "Presupuestos", icon: "📋" },
];

export default function AnalyticsScreen({ requests, statusCounts, onBack }) {
  const [tab, setTab] = useState("overview");

  const stats = useMemo(() => {
    const totalAmount = requests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const pendingCount = requests.filter(r =>
      ["borrador", "cotizacion", "presupuestado", "pendiente_aprobacion"].includes(r.status)
    ).length;
    const completedCount = requests.filter(r => r.status === "registrado_sap").length;
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
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ padding: "12px 20px" }}>
        <button onClick={onBack} style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: font, fontSize: 14, color: colors.primary, fontWeight: 500,
        }}>
          ← Volver
        </button>
      </div>

      <div style={{ padding: "0 20px 8px" }}>
        <h2 style={{
          fontFamily: fontDisplay, fontSize: 22, fontWeight: 600,
          color: colors.text, margin: "0 0 4px",
        }}>
          Análisis y Reportes
        </h2>
        <div style={{ fontSize: 13, color: colors.textLight, marginBottom: 12 }}>
          {requests.length} solicitudes · {formatGuaranies(stats.totalAmount)} total
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: "flex", gap: 4, padding: "0 20px 16px",
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "10px 12px", borderRadius: radius.md, border: "none",
            background: tab === t.key ? colors.primary : colors.card,
            color: tab === t.key ? "#fff" : colors.textLight,
            fontSize: 12, fontWeight: 600, fontFamily: font, cursor: "pointer",
            boxShadow: tab === t.key ? shadows.md : shadows.card,
            transition: "all 0.15s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px 120px" }}>
        {tab === "overview" && <OverviewTab stats={stats} requests={requests} statusCounts={statusCounts} />}
        {tab === "purchases" && <PurchasesTab stats={stats} />}
        {tab === "budgets" && <BudgetsTab />}
      </div>
    </div>
  );
}

// ==== TAB 1: Vision General ====
function OverviewTab({ stats, requests, statusCounts }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <KPICard label="Total Solicitudes" value={requests.length} color={colors.primary} />
        <KPICard label="Pendientes" value={stats.pendingCount} color={stats.pendingCount > 5 ? colors.danger : colors.warning} />
        <KPICard label="Completadas" value={stats.completedCount} color={colors.success} />
        <KPICard label="Emergencias" value={stats.emergencyCount} color={colors.danger} />
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
        borderRadius: radius.xl, padding: 20, marginBottom: 16, color: "#fff",
      }}>
        <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Monto Total Gestionado
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: font }}>{formatGuaranies(stats.totalAmount)}</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          Promedio por solicitud: {formatGuaranies(stats.avgAmount)}
        </div>
      </div>

      <Card title="Pipeline de Compras">
        {statusCounts.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 14, width: 22, textAlign: "center" }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: colors.text }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.count}</span>
              </div>
              <BarChart value={s.count} max={Math.max(...statusCounts.map(x => x.count), 1)} color={s.color} />
            </div>
          </div>
        ))}
      </Card>

      <Card title="Por Prioridad">
        {PRIORITY_LEVELS.map(u => (
          <div key={u.value} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: `1px solid ${colors.borderLight}`,
          }}>
            <span style={{ fontSize: 13, color: colors.text }}>{u.icon} {u.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: u.color }}>{stats.byUrgency[u.value] || 0}</span>
          </div>
        ))}
      </Card>
    </>
  );
}

// ==== TAB 2: Compras ====
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
      <Card title="Compras por Establecimiento" action={
        <button onClick={() => setSortBy(sortBy === "amount" ? "count" : "amount")} style={{
          background: "transparent", border: "none", fontSize: 11,
          color: colors.primary, cursor: "pointer", fontFamily: font, fontWeight: 500,
        }}>
          Por {sortBy === "amount" ? "cantidad" : "monto"}
        </button>
      }>
        {estEntries.map(([est, data]) => (
          <div key={est} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: colors.text }}>📍 {est}</span>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ fontSize: 11, color: colors.textLight }}>{data.count} sol.</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary }}>{formatGuaranies(data.amount)}</span>
              </div>
            </div>
            <BarChart value={data.amount} max={maxEstAmount} color={colors.primary} />
          </div>
        ))}
      </Card>

      <Card title="Compras por Sector">
        {secEntries.map(([sec, data]) => (
          <div key={sec} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: colors.text }}>{sec}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>{formatGuaranies(data.amount)}</span>
            </div>
            <BarChart value={data.amount} max={maxSecAmount} color={colors.accent} />
          </div>
        ))}
      </Card>

      <Card title="Por Tipo de Producto">
        {typeEntries.map(([type, data]) => (
          <div key={type} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 0", borderBottom: `1px solid ${colors.borderLight}`,
          }}>
            <span style={{ fontSize: 12, color: colors.text }}>{type}</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.primary }}>{formatGuaranies(data.amount)}</div>
              <div style={{ fontSize: 10, color: colors.textLight }}>{data.count} solicitudes</div>
            </div>
          </div>
        ))}
      </Card>

      {monthEntries.length > 0 && (
        <Card title="Tendencia Mensual">
          {monthEntries.map(([month, data]) => {
            const maxM = Math.max(...monthEntries.map(([, v]) => v.amount), 1);
            const monthLabel = new Date(month + "-01").toLocaleDateString("es-PY", { month: "short", year: "numeric" });
            return (
              <div key={month} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: colors.text, textTransform: "capitalize" }}>{monthLabel}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: colors.primary }}>
                    {formatGuaranies(data.amount)} ({data.count})
                  </span>
                </div>
                <BarChart value={data.amount} max={maxM} color={colors.success} />
              </div>
            );
          })}
        </Card>
      )}

      <Card title="Top Solicitantes">
        {reqEntries.map(([name, data], i) => (
          <div key={name} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 0", borderBottom: `1px solid ${colors.borderLight}`,
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: radius.md, display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 11,
              fontWeight: 700, color: "#fff",
              background: i < 3 ? colors.primary : colors.textLight,
            }}>
              {i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{name}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.primary }}>{data.count}</div>
              <div style={{ fontSize: 10, color: colors.textLight }}>{formatGuaranies(data.amount)}</div>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}

// ==== TAB 3: Presupuestos ====
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
      <div style={{
        background: `linear-gradient(135deg, ${overallPct > 80 ? colors.danger : colors.primary} 0%, ${overallPct > 80 ? "#a82020" : colors.primaryDark} 100%)`,
        borderRadius: radius.xl, padding: 20, marginBottom: 16, color: "#fff",
      }}>
        <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Presupuesto Global 2026
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: font }}>{overallPct}%</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {formatGuaranies(totalConsumed)} / {formatGuaranies(totalPlanned)}
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.2)", marginTop: 12 }}>
          <div style={{
            height: "100%", borderRadius: 3, background: "#fff",
            width: `${Math.min(overallPct, 100)}%`, transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
          Disponible: {formatGuaranies(totalPlanned - totalConsumed)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <KPICard label="Presupuestos Activos" value={budgets.length} color={colors.primary} />
        <KPICard label="Sobre 80%" value={budgets.filter(b => (b.consumed / b.planned) * 100 > 80).length} color={colors.danger} />
      </div>

      {Object.entries(byEst).sort((a, b) => a[0].localeCompare(b[0])).map(([est, estBudgets]) => {
        const estPlanned = estBudgets.reduce((s, b) => s + b.planned, 0);
        const estConsumed = estBudgets.reduce((s, b) => s + b.consumed, 0);
        const estPct = estPlanned > 0 ? Math.round((estConsumed / estPlanned) * 100) : 0;

        return (
          <Card key={est} title={`📍 ${est}`} subtitle={`${estPct}% ejecutado`}>
            {estBudgets.map(b => {
              const pct = b.planned > 0 ? Math.round((b.consumed / b.planned) * 100) : 0;
              const barColor = pct > 90 ? colors.danger : pct > 70 ? colors.warning : colors.success;
              return (
                <div key={b.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: colors.text, fontWeight: 500 }}>{b.sector}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: barColor }}>{pct}%</span>
                  </div>
                  <BarChart value={b.consumed} max={b.planned} color={barColor} height={6} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: colors.textLight }}>{formatGuaranies(b.consumed)}</span>
                    <span style={{ fontSize: 10, color: colors.textLight }}>{formatGuaranies(b.planned)}</span>
                  </div>
                </div>
              );
            })}
          </Card>
        );
      })}
    </>
  );
}

// ==== Shared Components ====
function Card({ title, subtitle, action, children }) {
  return (
    <div style={{
      background: colors.card, borderRadius: radius.lg, padding: 16,
      border: `1px solid ${colors.borderLight}`, marginBottom: 12,
      boxShadow: shadows.card,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{
            fontSize: 12, fontWeight: 600, color: colors.textLight,
            textTransform: "uppercase", letterSpacing: 1,
          }}>
            {title}
          </div>
          {subtitle && <div style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function BarChart({ value, max, color, height = 4 }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div style={{ height, borderRadius: height / 2, background: colors.border }}>
      <div style={{
        height: "100%", borderRadius: height / 2, background: color,
        width: `${Math.min(pct, 100)}%`, transition: "width 0.5s ease",
      }} />
    </div>
  );
}
