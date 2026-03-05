import { useState } from "react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";

/* ── Mock data ─────────────────────────────────────────────── */

const TIME_RANGES = [
  { key: "hoy", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "mes", label: "Mes" },
  { key: "ano", label: "Año" },
];

const PRIMARY_TILES = [
  {
    key: "operaciones",
    label: "Operaciones activas",
    value: 25,
    icon: "🔄",
    color: "#3b82f6",
    subMetrics: [
      { label: "Compras pendientes", value: 12 },
      { label: "Mov. ganado abiertos", value: 8 },
      { label: "Recepciones MP pend.", value: 5 },
    ],
    drillRoute: "dashboard",
  },
  {
    key: "monto",
    label: "Monto comprometido",
    value: "Gs 847M",
    icon: "💰",
    color: "#f59e0b",
    subMetrics: [
      { label: "En aprobación", value: "Gs 320M" },
      { label: "En proceso", value: "Gs 415M" },
      { label: "Combustible mes", value: "Gs 112M" },
    ],
    drillRoute: "dashboard",
  },
  {
    key: "inventario",
    label: "Inventario crítico",
    value: 9,
    icon: "📦",
    color: "#ef4444",
    subMetrics: [
      { label: "Productos críticos", value: 4 },
      { label: "Lotes por vencer", value: 3 },
      { label: "Sin precio reciente", value: 2 },
    ],
    drillRoute: "inventory",
  },
  {
    key: "alertas",
    label: "Alertas",
    value: 7,
    icon: "🚨",
    color: "#ef4444",
    subMetrics: [
      { label: "Alertas sanitarias", value: 3 },
      { label: "Docs pendientes", value: 2 },
      { label: "Divergencias", value: 2 },
    ],
    drillRoute: "notifications",
  },
];

const AREA_ROWS = [
  {
    key: "compras",
    icon: "📋",
    label: "Compras",
    metrics: [
      { label: "Pendientes", value: 12 },
      { label: "En proceso", value: 5 },
    ],
    status: { label: "12 pendientes", variant: "warning" },
    route: "dashboard",
  },
  {
    key: "ganado",
    icon: "🐄",
    label: "Ganado",
    metrics: [
      { label: "Por validar", value: 4 },
      { label: "En tránsito", value: 3 },
    ],
    status: { label: "3 alertas", variant: "danger" },
    route: "ganado",
  },
  {
    key: "materia_prima",
    icon: "🧪",
    label: "Materia Prima",
    metrics: [
      { label: "Lotes activos", value: 15 },
      { label: "Por vencer", value: 2 },
    ],
    status: { label: "2 por vencer", variant: "warning" },
    route: "materia_prima",
  },
  {
    key: "combustible",
    icon: "⛽",
    label: "Combustible",
    metrics: [
      { label: "Consumo (L)", value: "12.450" },
      { label: "Gasto (Gs)", value: "8.2M" },
    ],
    status: { label: "Normal", variant: "success" },
    route: "combustible",
  },
  {
    key: "catalogo",
    icon: "📦",
    label: "Catálogo",
    metrics: [
      { label: "Productos", value: 211 },
      { label: "Categorías", value: 6 },
    ],
    status: { label: "Actualizado", variant: "success" },
    route: "inventory",
  },
];

const ACTIVITY_MODULES = [
  { key: "todos", label: "Todos" },
  { key: "compras", label: "Compras" },
  { key: "ganado", label: "Ganado" },
  { key: "materia_prima", label: "Materia Prima" },
  { key: "combustible", label: "Combustible" },
  { key: "catalogo", label: "Catálogo" },
];

const MODULE_META = {
  compras: { label: "Compras", variant: "info", icon: "📋" },
  ganado: { label: "Ganado", variant: "purple", icon: "🐄" },
  catalogo: { label: "Catálogo", variant: "info", icon: "📦" },
  materia_prima: { label: "Materia Prima", variant: "success", icon: "🧪" },
  combustible: { label: "Combustible", variant: "warning", icon: "⛽" },
};

const ACTIVITY_FEED = [
  { id: 1, module: "compras", text: "Solicitud SC-2024-089 aprobada por Gerencia", time: "Hace 15 min", icon: "✅", route: "dashboard" },
  { id: 2, module: "ganado", text: "Nuevo movimiento MG-0045 registrado — 120 cabezas", time: "Hace 32 min", icon: "🐄", route: "ganado" },
  { id: 3, module: "catalogo", text: "Nuevo producto registrado: Ivermectina 3.15%", time: "Hace 1 hora", icon: "📦", route: "inventory" },
  { id: 4, module: "compras", text: "Cotización recibida de Proveedor ABC", time: "Hace 2 horas", icon: "📄", route: "dashboard" },
  { id: 5, module: "ganado", text: "Alerta sanitaria: Vacunación pendiente Est. Norte", time: "Hace 3 horas", icon: "🚨", route: "ganado" },
  { id: 6, module: "combustible", text: "Carga de 3.200 L diésel — Est. Ypoti", time: "Hace 5 horas", icon: "⛽", route: "combustible" },
  { id: 7, module: "materia_prima", text: "Lote MP-0412 recibido — Maíz Amarillo 25 ton", time: "Hace 5 horas", icon: "🧪", route: "materia_prima" },
  { id: 8, module: "combustible", text: "Alerta: consumo elevado en Est. Lusipar (+18%)", time: "Hace 6 horas", icon: "🚨", route: "combustible" },
];

/* ── Sub-components ────────────────────────────────────────── */

function TimeRangePill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-colors border ${
        active
          ? "bg-[#1F2A44] text-[#C8A03A] border-[#C8A03A]/30"
          : "bg-transparent text-slate-400 border-white/[0.06] hover:bg-[#F8F9FB]/[0.06] dark:border-white/[0.06]"
      }`}
    >
      {label}
    </button>
  );
}

function PrimaryTile({ tile, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#F8F9FB]/[0.03] dark:bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:bg-[#F8F9FB]/[0.06] hover:border-white/[0.12] transition-all group"
    >
      {/* Top: icon + label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{tile.icon}</span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            {tile.label}
          </span>
        </div>
        <svg className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Big number */}
      <div className="text-[28px] font-bold text-white leading-none mb-3" style={{ color: tile.color }}>
        {tile.value}
      </div>

      {/* Sub-metrics */}
      <div className="flex flex-col gap-1.5">
        {tile.subMetrics.map((sm) => (
          <div key={sm.label} className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">{sm.label}</span>
            <span className="text-slate-300 font-medium">{sm.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AreaRow({ row, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#F8F9FB]/[0.04] transition-colors group"
    >
      {/* Icon */}
      <span className="text-lg w-6 text-center shrink-0">{row.icon}</span>

      {/* Module name */}
      <div className="w-28 shrink-0">
        <span className="text-[13px] font-semibold text-white">{row.label}</span>
      </div>

      {/* Metrics */}
      <div className="flex-1 flex items-center gap-4">
        {row.metrics.map((m) => (
          <div key={m.label} className="flex items-baseline gap-1.5">
            <span className="text-[13px] font-bold text-white">{m.value}</span>
            <span className="text-[10px] text-slate-500">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Status chip */}
      <Badge variant={row.status.variant} size="xs" dot>
        {row.status.label}
      </Badge>

      {/* Arrow */}
      <svg className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function ActivityFilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer whitespace-nowrap transition-colors border ${
        active
          ? "bg-[#1F2A44]/30 text-[#C8A03A] border-[#C8A03A]/20"
          : "bg-transparent text-slate-500 border-transparent hover:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function ActivityEntry({ entry, onNavigate }) {
  const meta = MODULE_META[entry.module];
  return (
    <div
      onClick={() => onNavigate?.(entry.route)}
      className="flex gap-3 items-start px-4 py-3 cursor-pointer hover:bg-[#F8F9FB]/[0.04] transition-colors group"
    >
      <span className="text-sm mt-0.5 shrink-0">{entry.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant={meta?.variant || "default"} size="xs">
            {meta?.label || entry.module}
          </Badge>
          <span className="text-[10px] text-slate-500">{entry.time}</span>
        </div>
        <div className="text-[13px] text-white leading-snug">{entry.text}</div>
      </div>
      <svg className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */

export default function PanelGeneral({ onNavigate, initialModule }) {
  const [timeRange, setTimeRange] = useState("30d");
  const [activityFilter, setActivityFilter] = useState("todos");

  const filteredActivity =
    activityFilter === "todos"
      ? ACTIVITY_FEED
      : ACTIVITY_FEED.filter((a) => a.module === activityFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      {/* ─── A) TOP BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-[22px] font-bold text-white tracking-tight mb-1">
            Panel General
          </h2>
          <p className="text-sm text-slate-500 m-0">
            Control operativo consolidado
          </p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {TIME_RANGES.map((tr) => (
            <TimeRangePill
              key={tr.key}
              label={tr.label}
              active={timeRange === tr.key}
              onClick={() => setTimeRange(tr.key)}
            />
          ))}
        </div>
      </div>

      {/* ─── B) INDICADORES CLAVE — 4 primary tiles ─── */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
          Indicadores clave
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRIMARY_TILES.map((tile) => (
            <PrimaryTile
              key={tile.key}
              tile={tile}
              onClick={() => onNavigate?.(tile.drillRoute)}
            />
          ))}
        </div>
      </div>

      {/* ─── C) OPERACIÓN POR ÁREA — module rows ─── */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1 mb-3">
          Operación por área
        </div>
        <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
          {AREA_ROWS.map((row) => (
            <AreaRow
              key={row.key}
              row={row}
              onClick={() => onNavigate?.(row.route)}
            />
          ))}
        </Card>
      </div>

      {/* ─── D) ACTIVIDAD RECIENTE ─── */}
      <div>
        <div className="flex items-center justify-between px-1 mb-3">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Actividad reciente
          </div>
          <div className="flex gap-0.5 overflow-x-auto scrollbar-none">
            {ACTIVITY_MODULES.map((m) => (
              <ActivityFilterPill
                key={m.key}
                label={m.label}
                active={activityFilter === m.key}
                onClick={() => setActivityFilter(m.key)}
              />
            ))}
          </div>
        </div>
        <Card hover={false} className="p-0 divide-y divide-white/[0.04] overflow-hidden">
          {filteredActivity.length > 0 ? (
            filteredActivity.map((entry) => (
              <ActivityEntry key={entry.id} entry={entry} onNavigate={onNavigate} />
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-500">
                No hay actividad reciente para este módulo
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
