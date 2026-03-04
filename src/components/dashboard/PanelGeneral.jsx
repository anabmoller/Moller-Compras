import { useState } from "react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import KPICard from "../common/KPICard";

/* ── Mock data ─────────────────────────────────────────────── */

const MODULES = [
  { key: "todos", label: "Todos", icon: "📊" },
  { key: "compras", label: "Compras", icon: "📋" },
  { key: "ganado", label: "Ganado", icon: "🐄" },
  { key: "inventario", label: "Inventario", icon: "📦" },
  { key: "materia_prima", label: "Materia Prima", icon: "🏭" },
];

const SUMMARY_CARDS = {
  compras: [
    { label: "Solicitudes pendientes", value: 12, icon: "⏳", color: "#f59e0b" },
    { label: "En proceso", value: 5, icon: "🔄", color: "#3b82f6" },
  ],
  ganado: [
    { label: "Alertas sanitarias", value: 3, icon: "🚨", color: "#ef4444" },
    { label: "Movimientos recientes", value: 8, icon: "🚚", color: "#8b5cf6" },
  ],
  inventario: [
    { label: "Stock cr\u00edtico", value: 7, icon: "⚠️", color: "#f59e0b" },
    { label: "Reposiciones", value: 4, icon: "📥", color: "#22c55e" },
  ],
  materia_prima: [
    { label: "Lotes activos", value: 15, icon: "📦", color: "#3b82f6" },
    { label: "Por vencer", value: 2, icon: "⏰", color: "#ef4444" },
  ],
};

const MODULE_META = {
  compras: { label: "Compras", variant: "info", icon: "📋" },
  ganado: { label: "Ganado", variant: "purple", icon: "🐄" },
  inventario: { label: "Inventario", variant: "warning", icon: "📦" },
  materia_prima: { label: "Materia Prima", variant: "success", icon: "🏭" },
};

const ACTIVITY_FEED = [
  { id: 1, module: "compras", text: "Solicitud SC-2024-089 aprobada por Gerencia", time: "Hace 15 min", icon: "✅" },
  { id: 2, module: "ganado", text: "Nuevo movimiento MG-0045 registrado \u2014 120 cabezas", time: "Hace 32 min", icon: "🐄" },
  { id: 3, module: "inventario", text: "Alerta: Stock cr\u00edtico en Producto X", time: "Hace 1 hora", icon: "⚠️" },
  { id: 4, module: "compras", text: "Cotizaci\u00f3n recibida de Proveedor ABC", time: "Hace 2 horas", icon: "📄" },
  { id: 5, module: "ganado", text: "Alerta sanitaria: Vacunaci\u00f3n pendiente Est. Norte", time: "Hace 3 horas", icon: "🚨" },
  { id: 6, module: "inventario", text: "Reposici\u00f3n completada \u2014 50 unidades ingresadas", time: "Hace 4 horas", icon: "📥" },
];

/* ── Sub-components ────────────────────────────────────────── */

function FilterPill({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-[5px] rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 ${
        active
          ? "bg-[#1F2A44]/10 text-[#C8A03A] border-2 border-[#C8A03A]"
          : "bg-[#F8F9FB]/[0.03] text-slate-400 border border-white/[0.06] hover:bg-[#F8F9FB]/[0.06]"
      }`}
    >
      <span className="text-xs">{icon}</span>
      {label}
    </button>
  );
}

function ModuleSection({ moduleKey }) {
  const meta = MODULE_META[moduleKey];
  const cards = SUMMARY_CARDS[moduleKey];
  if (!meta || !cards) return null;

  return (
    <div className="mb-5">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2.5 flex items-center gap-1.5">
        <span>{meta.icon}</span>
        {meta.label}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <KPICard key={c.label} label={c.label} value={c.value} icon={c.icon} color={c.color} />
        ))}
      </div>
    </div>
  );
}

function ActivityEntry({ entry }) {
  const meta = MODULE_META[entry.module];
  return (
    <Card hover={false} className="p-3 mb-2">
      <div className="flex gap-3 items-start">
        <span className="text-sm mt-0.5">{entry.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={meta?.variant || "default"} size="xs">
              {meta?.label || entry.module}
            </Badge>
          </div>
          <div className="text-sm text-white">{entry.text}</div>
          <div className="text-[10px] text-slate-500 mt-1">{entry.time}</div>
        </div>
      </div>
    </Card>
  );
}

/* ── Main component ────────────────────────────────────────── */

export default function PanelGeneral({ onNavigate }) {
  const [activeModule, setActiveModule] = useState("todos");

  const visibleModules =
    activeModule === "todos"
      ? Object.keys(SUMMARY_CARDS)
      : [activeModule].filter((k) => SUMMARY_CARDS[k]);

  const visibleActivity =
    activeModule === "todos"
      ? ACTIVITY_FEED
      : ACTIVITY_FEED.filter((a) => a.module === activeModule);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[22px] font-bold text-white tracking-tight mb-1">
          Panel General
        </h2>
        <p className="text-sm text-slate-500 m-0">
          Visi&oacute;n consolidada de los m&oacute;dulos
        </p>
      </div>

      {/* Module filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
        {MODULES.map((m) => (
          <FilterPill
            key={m.key}
            label={m.label}
            icon={m.icon}
            active={activeModule === m.key}
            onClick={() => setActiveModule(m.key)}
          />
        ))}
      </div>

      {/* Summary cards by module */}
      <div className="mb-6">
        {visibleModules.map((key) => (
          <ModuleSection key={key} moduleKey={key} />
        ))}
      </div>

      {/* Activity feed */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3 flex items-center gap-1.5">
          🕐 Actividad reciente
        </div>
        {visibleActivity.length > 0 ? (
          visibleActivity.map((entry) => (
            <ActivityEntry key={entry.id} entry={entry} />
          ))
        ) : (
          <Card hover={false} className="p-6 text-center">
            <p className="text-sm text-slate-500">
              No hay actividad reciente para este m&oacute;dulo
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
