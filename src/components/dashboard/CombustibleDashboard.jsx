import { useState, useMemo } from "react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import PageHeader from "../common/PageHeader";
import { ESTABLECIMIENTOS_PROPIOS } from "../../constants/establecimientos";

/* ── Mock data (MVP — will be replaced by Supabase RPC) ────── */

const KPI_DATA = {
  todos: [
    { key: "consumo_mes", label: "Consumo Mes (L)", value: "12.450", icon: "⛽", color: "#3b82f6" },
    { key: "gasto_mes", label: "Gasto Mes (Gs)", value: "8.2M", icon: "💰", color: "#C8A03A" },
    { key: "cargas", label: "Cargas", value: 38, icon: "🚛", color: "#8b5cf6" },
    { key: "precio_lt", label: "Precio/Lt (Gs)", value: "6.580", icon: "📊", color: "#10b981" },
  ],
  ypoti: [
    { key: "consumo_mes", label: "Consumo Mes (L)", value: "4.200", icon: "⛽", color: "#3b82f6" },
    { key: "gasto_mes", label: "Gasto Mes (Gs)", value: "2.8M", icon: "💰", color: "#C8A03A" },
    { key: "cargas", label: "Cargas", value: 14, icon: "🚛", color: "#8b5cf6" },
    { key: "precio_lt", label: "Precio/Lt (Gs)", value: "6.580", icon: "📊", color: "#10b981" },
  ],
  cerro_moimbi: [
    { key: "consumo_mes", label: "Consumo Mes (L)", value: "3.100", icon: "⛽", color: "#3b82f6" },
    { key: "gasto_mes", label: "Gasto Mes (Gs)", value: "2.1M", icon: "💰", color: "#C8A03A" },
    { key: "cargas", label: "Cargas", value: 10, icon: "🚛", color: "#8b5cf6" },
    { key: "precio_lt", label: "Precio/Lt (Gs)", value: "6.580", icon: "📊", color: "#10b981" },
  ],
};

const PROVIDERS = [
  { id: 1, name: "Petropar", items: "Diésel, Gasolina", lastDelivery: "1 Mar 2026", status: "active" },
  { id: 2, name: "Copetrol S.A.", items: "Diésel Premium", lastDelivery: "27 Feb 2026", status: "active" },
  { id: 3, name: "Puma Energy", items: "Diésel", lastDelivery: "22 Feb 2026", status: "active" },
];

const RECENT_ACTIVITY = [
  { id: 1, text: "Carga de 3.200 L diésel — Ypotí", time: "Hace 5 horas", icon: "⛽", estab: "ypoti" },
  { id: 2, text: "Alerta: consumo elevado en Cerro Moimbí (+18%)", time: "Hace 6 horas", icon: "🚨", estab: "cerro_moimbi" },
  { id: 3, text: "Carga de 2.500 L diésel — Santa Clara", time: "Hace 1 día", icon: "⛽", estab: "santa_clara" },
  { id: 4, text: "Factura procesada — Petropar Febrero", time: "Hace 2 días", icon: "📄", estab: null },
  { id: 5, text: "Carga de 1.800 L gasolina — Ouro Verde", time: "Hace 3 días", icon: "⛽", estab: "ouro_verde" },
];

/* ── Sub-components ─────────────────────────────────────────── */

function KpiCard({ label, value, icon, color }) {
  return (
    <div className="bg-[#13141a] border border-white/[0.06] rounded-xl p-4 flex-1 min-w-[140px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: color || "#fff" }}>
        {value}
      </div>
    </div>
  );
}

function ProviderRow({ provider }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="text-lg shrink-0">⛽</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">{provider.name}</div>
        <div className="text-[11px] text-slate-500">{provider.items} · Última entrega: {provider.lastDelivery}</div>
      </div>
      <Badge variant={provider.status === "active" ? "success" : "default"} size="xs" dot>
        {provider.status === "active" ? "Activo" : "Inactivo"}
      </Badge>
    </div>
  );
}

function ActivityRow({ entry }) {
  return (
    <div className="flex gap-3 items-start px-4 py-3 hover:bg-[#F8F9FB]/[0.04] transition-colors">
      <span className="text-sm mt-0.5 shrink-0">{entry.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-white leading-snug">{entry.text}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{entry.time}</div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export default function CombustibleDashboard({ onNavigate }) {
  const [establecimiento, setEstablecimiento] = useState("todos");

  const kpis = useMemo(() => {
    return KPI_DATA[establecimiento] || KPI_DATA.todos;
  }, [establecimiento]);

  const filteredActivity = useMemo(() => {
    if (establecimiento === "todos") return RECENT_ACTIVITY;
    return RECENT_ACTIVITY.filter(a => !a.estab || a.estab === establecimiento);
  }, [establecimiento]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <PageHeader
          title="Combustible"
          subtitle="Consumo, cargas y control de gastos"
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
        {kpis.map(k => (
          <KpiCard key={k.key} {...k} />
        ))}
      </div>

      {/* Two-column layout: Providers + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-5 sm:px-0">
        {/* Providers */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Proveedores
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {PROVIDERS.map(p => (
              <ProviderRow key={p.id} provider={p} />
            ))}
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
            Actividad Reciente
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
            {filteredActivity.length > 0 ? (
              filteredActivity.map(entry => (
                <ActivityRow key={entry.id} entry={entry} />
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-500">No hay actividad reciente</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
