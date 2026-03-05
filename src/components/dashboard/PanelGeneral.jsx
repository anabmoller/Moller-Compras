import { useState, useMemo } from "react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import { ESTABLECIMIENTOS_PROPIOS } from "../../constants/establecimientos";

/* ── Mock data ─────────────────────────────────────────────── */

const TIME_RANGES = [
  { key: "hoy", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "mes", label: "Mes" },
  { key: "ano", label: "Año" },
];

/*
 * Each tile/row/activity entry carries an `establecimiento` key (or array)
 * so the establishment filter can slice mock data per location.
 * "todos" or omitted = visible in all establishments.
 */

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
    // Per-establishment mock breakdown (value overrides when filtered)
    byEstab: {
      ypoti:        { value: 8,  subMetrics: [{ label: "Compras pendientes", value: 4 }, { label: "Mov. ganado abiertos", value: 3 }, { label: "Recepciones MP pend.", value: 1 }] },
      cerro_moimbi: { value: 5,  subMetrics: [{ label: "Compras pendientes", value: 2 }, { label: "Mov. ganado abiertos", value: 2 }, { label: "Recepciones MP pend.", value: 1 }] },
      santa_clara:  { value: 4,  subMetrics: [{ label: "Compras pendientes", value: 2 }, { label: "Mov. ganado abiertos", value: 1 }, { label: "Recepciones MP pend.", value: 1 }] },
      ouro_verde:   { value: 3,  subMetrics: [{ label: "Compras pendientes", value: 1 }, { label: "Mov. ganado abiertos", value: 1 }, { label: "Recepciones MP pend.", value: 1 }] },
      serrumbi:     { value: 2,  subMetrics: [{ label: "Compras pendientes", value: 1 }, { label: "Mov. ganado abiertos", value: 1 }, { label: "Recepciones MP pend.", value: 0 }] },
      ibirora:      { value: 1,  subMetrics: [{ label: "Compras pendientes", value: 1 }, { label: "Mov. ganado abiertos", value: 0 }, { label: "Recepciones MP pend.", value: 0 }] },
      ibirapita:    { value: 1,  subMetrics: [{ label: "Compras pendientes", value: 1 }, { label: "Mov. ganado abiertos", value: 0 }, { label: "Recepciones MP pend.", value: 0 }] },
      vila_azul:    { value: 1,  subMetrics: [{ label: "Compras pendientes", value: 0 }, { label: "Mov. ganado abiertos", value: 1 }, { label: "Recepciones MP pend.", value: 0 }] },
      santa_maria_das_neves: { value: 0, subMetrics: [{ label: "Compras pendientes", value: 0 }, { label: "Mov. ganado abiertos", value: 0 }, { label: "Recepciones MP pend.", value: 0 }] },
    },
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
    byEstab: {
      ypoti:        { value: "Gs 280M", subMetrics: [{ label: "En aprobación", value: "Gs 95M" }, { label: "En proceso", value: "Gs 140M" }, { label: "Combustible mes", value: "Gs 45M" }] },
      cerro_moimbi: { value: "Gs 185M", subMetrics: [{ label: "En aprobación", value: "Gs 75M" }, { label: "En proceso", value: "Gs 85M" }, { label: "Combustible mes", value: "Gs 25M" }] },
      santa_clara:  { value: "Gs 142M", subMetrics: [{ label: "En aprobación", value: "Gs 60M" }, { label: "En proceso", value: "Gs 65M" }, { label: "Combustible mes", value: "Gs 17M" }] },
      ouro_verde:   { value: "Gs 98M",  subMetrics: [{ label: "En aprobación", value: "Gs 40M" }, { label: "En proceso", value: "Gs 48M" }, { label: "Combustible mes", value: "Gs 10M" }] },
      serrumbi:     { value: "Gs 62M",  subMetrics: [{ label: "En aprobación", value: "Gs 25M" }, { label: "En proceso", value: "Gs 32M" }, { label: "Combustible mes", value: "Gs 5M" }] },
    },
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
    byEstab: {
      ypoti:        { value: 3, subMetrics: [{ label: "Productos críticos", value: 1 }, { label: "Lotes por vencer", value: 1 }, { label: "Sin precio reciente", value: 1 }] },
      cerro_moimbi: { value: 2, subMetrics: [{ label: "Productos críticos", value: 1 }, { label: "Lotes por vencer", value: 1 }, { label: "Sin precio reciente", value: 0 }] },
      santa_clara:  { value: 2, subMetrics: [{ label: "Productos críticos", value: 1 }, { label: "Lotes por vencer", value: 0 }, { label: "Sin precio reciente", value: 1 }] },
      ouro_verde:   { value: 1, subMetrics: [{ label: "Productos críticos", value: 1 }, { label: "Lotes por vencer", value: 0 }, { label: "Sin precio reciente", value: 0 }] },
      serrumbi:     { value: 1, subMetrics: [{ label: "Productos críticos", value: 0 }, { label: "Lotes por vencer", value: 1 }, { label: "Sin precio reciente", value: 0 }] },
    },
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
    byEstab: {
      ypoti:        { value: 3, subMetrics: [{ label: "Alertas sanitarias", value: 1 }, { label: "Docs pendientes", value: 1 }, { label: "Divergencias", value: 1 }] },
      cerro_moimbi: { value: 2, subMetrics: [{ label: "Alertas sanitarias", value: 1 }, { label: "Docs pendientes", value: 1 }, { label: "Divergencias", value: 0 }] },
      santa_clara:  { value: 1, subMetrics: [{ label: "Alertas sanitarias", value: 1 }, { label: "Docs pendientes", value: 0 }, { label: "Divergencias", value: 0 }] },
      serrumbi:     { value: 1, subMetrics: [{ label: "Alertas sanitarias", value: 0 }, { label: "Docs pendientes", value: 0 }, { label: "Divergencias", value: 1 }] },
    },
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
    byEstab: {
      ypoti:        { metrics: [{ label: "Pendientes", value: 4 }, { label: "En proceso", value: 2 }], status: { label: "4 pendientes", variant: "warning" } },
      cerro_moimbi: { metrics: [{ label: "Pendientes", value: 3 }, { label: "En proceso", value: 1 }], status: { label: "3 pendientes", variant: "warning" } },
      santa_clara:  { metrics: [{ label: "Pendientes", value: 2 }, { label: "En proceso", value: 1 }], status: { label: "2 pendientes", variant: "warning" } },
      ouro_verde:   { metrics: [{ label: "Pendientes", value: 2 }, { label: "En proceso", value: 1 }], status: { label: "2 pendientes", variant: "warning" } },
      serrumbi:     { metrics: [{ label: "Pendientes", value: 1 }, { label: "En proceso", value: 0 }], status: { label: "1 pendiente", variant: "default" } },
    },
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
    byEstab: {
      ypoti:        { metrics: [{ label: "Por validar", value: 2 }, { label: "En tránsito", value: 1 }], status: { label: "1 alerta", variant: "danger" } },
      cerro_moimbi: { metrics: [{ label: "Por validar", value: 1 }, { label: "En tránsito", value: 1 }], status: { label: "1 alerta", variant: "danger" } },
      santa_clara:  { metrics: [{ label: "Por validar", value: 1 }, { label: "En tránsito", value: 1 }], status: { label: "1 alerta", variant: "danger" } },
    },
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
    byEstab: {
      ypoti:        { metrics: [{ label: "Lotes activos", value: 6 }, { label: "Por vencer", value: 1 }], status: { label: "1 por vencer", variant: "warning" } },
      cerro_moimbi: { metrics: [{ label: "Lotes activos", value: 4 }, { label: "Por vencer", value: 1 }], status: { label: "1 por vencer", variant: "warning" } },
      santa_clara:  { metrics: [{ label: "Lotes activos", value: 3 }, { label: "Por vencer", value: 0 }], status: { label: "Normal", variant: "success" } },
      ouro_verde:   { metrics: [{ label: "Lotes activos", value: 2 }, { label: "Por vencer", value: 0 }], status: { label: "Normal", variant: "success" } },
    },
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
    byEstab: {
      ypoti:        { metrics: [{ label: "Consumo (L)", value: "4.200" }, { label: "Gasto (Gs)", value: "2.8M" }], status: { label: "Normal", variant: "success" } },
      cerro_moimbi: { metrics: [{ label: "Consumo (L)", value: "3.100" }, { label: "Gasto (Gs)", value: "2.1M" }], status: { label: "+18%", variant: "warning" } },
      santa_clara:  { metrics: [{ label: "Consumo (L)", value: "2.600" }, { label: "Gasto (Gs)", value: "1.7M" }], status: { label: "Normal", variant: "success" } },
      ouro_verde:   { metrics: [{ label: "Consumo (L)", value: "1.550" }, { label: "Gasto (Gs)", value: "1.0M" }], status: { label: "Normal", variant: "success" } },
      serrumbi:     { metrics: [{ label: "Consumo (L)", value: "1.000" }, { label: "Gasto (Gs)", value: "0.6M" }], status: { label: "Normal", variant: "success" } },
    },
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
    // Catálogo is global — no per-establishment breakdown
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
  { id: 1, module: "compras", establecimiento: "ypoti", text: "Solicitud SC-2024-089 aprobada por Gerencia", time: "Hace 15 min", icon: "✅", route: "dashboard" },
  { id: 2, module: "ganado", establecimiento: "cerro_moimbi", text: "Nuevo movimiento MG-0045 registrado — 120 cabezas", time: "Hace 32 min", icon: "🐄", route: "ganado" },
  { id: 3, module: "catalogo", establecimiento: null, text: "Nuevo producto registrado: Ivermectina 3.15%", time: "Hace 1 hora", icon: "📦", route: "inventory" },
  { id: 4, module: "compras", establecimiento: "santa_clara", text: "Cotización recibida de Proveedor ABC", time: "Hace 2 horas", icon: "📄", route: "dashboard" },
  { id: 5, module: "ganado", establecimiento: "ypoti", text: "Alerta sanitaria: Vacunación pendiente Ypotí", time: "Hace 3 horas", icon: "🚨", route: "ganado" },
  { id: 6, module: "combustible", establecimiento: "ypoti", text: "Carga de 3.200 L diésel — Ypotí", time: "Hace 5 horas", icon: "⛽", route: "combustible" },
  { id: 7, module: "materia_prima", establecimiento: "ouro_verde", text: "Lote MP-0412 recibido — Maíz Amarillo 25 ton", time: "Hace 5 horas", icon: "🧪", route: "materia_prima" },
  { id: 8, module: "combustible", establecimiento: "cerro_moimbi", text: "Alerta: consumo elevado en Cerro Moimbí (+18%)", time: "Hace 6 horas", icon: "🚨", route: "combustible" },
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

/* ── Establishment dropdown ────────────────────────────────── */

function EstablecimientoSelect({ value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-lg pl-3 pr-8 py-1.5 text-[11px] font-semibold text-slate-300 cursor-pointer hover:bg-[#F8F9FB]/[0.06] hover:border-white/[0.12] transition-colors focus:outline-none focus:border-[#C8A03A]/40"
      >
        <option value="todos">Todos</option>
        {ESTABLECIMIENTOS_PROPIOS.map((e) => (
          <option key={e.key} value={e.key}>
            {e.nombre}
          </option>
        ))}
      </select>
      <svg className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

/* ── Filter helpers ────────────────────────────────────────── */

/** Resolve a tile's values for the selected establishment */
function resolveTile(tile, estabKey) {
  if (estabKey === "todos" || !tile.byEstab) return tile;
  const override = tile.byEstab[estabKey];
  if (!override) {
    // Establishment exists but has no data for this tile — show zeros
    return {
      ...tile,
      value: typeof tile.value === "string" ? "Gs 0" : 0,
      subMetrics: tile.subMetrics.map((sm) => ({
        ...sm,
        value: typeof sm.value === "string" ? "Gs 0" : 0,
      })),
    };
  }
  return { ...tile, ...override };
}

/** Resolve a row's metrics/status for the selected establishment */
function resolveRow(row, estabKey) {
  if (estabKey === "todos" || !row.byEstab) return row;
  const override = row.byEstab[estabKey];
  if (!override) {
    return {
      ...row,
      metrics: row.metrics.map((m) => ({ ...m, value: typeof m.value === "string" ? "0" : 0 })),
      status: { label: "Sin datos", variant: "default" },
    };
  }
  return { ...row, ...override };
}

/* ── Main component ────────────────────────────────────────── */

export default function PanelGeneral({ onNavigate }) {
  const [timeRange, setTimeRange] = useState("30d");
  const [activityFilter, setActivityFilter] = useState("todos");
  const [establecimiento, setEstablecimiento] = useState("todos");

  // Filter activity feed by module AND establishment
  const filteredActivity = useMemo(() => {
    let items = ACTIVITY_FEED;
    if (activityFilter !== "todos") {
      items = items.filter((a) => a.module === activityFilter);
    }
    if (establecimiento !== "todos") {
      items = items.filter(
        (a) => !a.establecimiento || a.establecimiento === establecimiento
      );
    }
    return items;
  }, [activityFilter, establecimiento]);

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
        <div className="flex items-center gap-3">
          {/* Establishment selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden sm:inline">
              Establecimiento
            </span>
            <EstablecimientoSelect value={establecimiento} onChange={setEstablecimiento} />
          </div>

          {/* Period pills */}
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
              tile={resolveTile(tile, establecimiento)}
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
              row={resolveRow(row, establecimiento)}
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
                No hay actividad reciente para este filtro
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
