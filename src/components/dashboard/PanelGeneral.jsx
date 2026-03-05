import { useState } from "react";
import Card from "../shared/Card";
import Badge from "../shared/Badge";
import KPICard from "../common/KPICard";

/* ── Mock data ─────────────────────────────────────────────── */

const MODULES = [
  { key: "todos", label: "Todos", icon: "📊" },
  { key: "compras", label: "Compras", icon: "📋" },
  { key: "ganado", label: "Ganado", icon: "🐄" },
  { key: "catalogo", label: "Catálogo", icon: "📦" },
  { key: "materia_prima", label: "Materia Prima", icon: "🏭" },
  { key: "combustible", label: "Combustible", icon: "⛽" },
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
  catalogo: [
    { label: "Productos registrados", value: 204, icon: "📦", color: "#8b5cf6" },
    { label: "Categorías activas", value: 6, icon: "🏷️", color: "#3b82f6" },
  ],
  materia_prima: [
    { label: "Lotes activos", value: 15, icon: "📦", color: "#3b82f6" },
    { label: "Por vencer", value: 2, icon: "⏰", color: "#ef4444" },
  ],
  combustible: [
    { label: "Consumo del mes", value: "12.450 L", icon: "⛽", color: "#f59e0b" },
    { label: "Gasto del mes", value: "$8.2M", icon: "💰", color: "#3b82f6" },
  ],
};

const MODULE_META = {
  compras: { label: "Compras", variant: "info", icon: "📋" },
  ganado: { label: "Ganado", variant: "purple", icon: "🐄" },
  catalogo: { label: "Catálogo", variant: "info", icon: "📦" },
  materia_prima: { label: "Materia Prima", variant: "success", icon: "🏭" },
  combustible: { label: "Combustible", variant: "warning", icon: "⛽" },
};

const ACTIVITY_FEED = [
  { id: 1, module: "compras", text: "Solicitud SC-2024-089 aprobada por Gerencia", time: "Hace 15 min", icon: "✅" },
  { id: 2, module: "ganado", text: "Nuevo movimiento MG-0045 registrado — 120 cabezas", time: "Hace 32 min", icon: "🐄" },
  { id: 3, module: "catalogo", text: "Nuevo producto registrado: Ivermectina 3.15%", time: "Hace 1 hora", icon: "📦" },
  { id: 4, module: "compras", text: "Cotización recibida de Proveedor ABC", time: "Hace 2 horas", icon: "📄" },
  { id: 5, module: "ganado", text: "Alerta sanitaria: Vacunación pendiente Est. Norte", time: "Hace 3 horas", icon: "🚨" },
  { id: 6, module: "catalogo", text: "Categoría Equipos actualizada — 3 productos añadidos", time: "Hace 4 horas", icon: "🏷️" },
  { id: 7, module: "combustible", text: "Carga de 3.200 L diésel — Est. Ypoti", time: "Hace 5 horas", icon: "⛽" },
  { id: 8, module: "combustible", text: "Alerta: consumo elevado en Est. Lusipar (+18%)", time: "Hace 6 horas", icon: "🚨" },
];

/* ── Materia Prima expanded mock data ─────────────────────── */

const MP_KPI_CARDS = [
  { label: "Materias activas", value: 24, icon: "📦", color: "#3b82f6" },
  { label: "Por vencer (30d)", value: 3, icon: "⏰", color: "#ef4444" },
  { label: "Últimas compras", value: "$48.2K", icon: "💰", color: "#22c55e" },
  { label: "Alertas de recepción", value: 5, icon: "🚨", color: "#f59e0b" },
];

const MP_COMMODITIES = [
  { material: "Maíz Amarillo", precio: "$215/ton", ultimaCompra: "28 Feb 2026", proveedor: "Agro Norte SA", estado: "En stock" },
  { material: "Sorgo Grano", precio: "$180/ton", ultimaCompra: "25 Feb 2026", proveedor: "Cereales del Valle", estado: "En stock" },
  { material: "Pasta de Soya", precio: "$420/ton", ultimaCompra: "20 Feb 2026", proveedor: "Oleaginosas MX", estado: "Por agotar" },
  { material: "Melaza de Caña", precio: "$95/ton", ultimaCompra: "15 Feb 2026", proveedor: "Ingenio Central", estado: "En stock" },
  { material: "Sal Mineral", precio: "$310/ton", ultimaCompra: "10 Feb 2026", proveedor: "Minerales Plus", estado: "Crítico" },
  { material: "Heno de Alfalfa", precio: "$175/ton", ultimaCompra: "05 Feb 2026", proveedor: "Forrajes del Norte", estado: "En stock" },
];

const MP_SUPPLIERS = [
  { name: "Agro Norte SA", items: 5, status: "Activo" },
  { name: "Cereales del Valle", items: 3, status: "Activo" },
  { name: "Oleaginosas MX", items: 2, status: "Activo" },
  { name: "Ingenio Central", items: 1, status: "Pendiente" },
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

/* ── Materia Prima expanded view ──────────────────────────── */

function EstadoBadge({ estado }) {
  const styles = {
    "En stock": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Por agotar": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Crítico": "bg-red-500/10 text-red-400 border-red-500/20",
    Activo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Pendiente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[estado] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`}>
      {estado}
    </span>
  );
}

function MateriaPrimaView({ onNavigate }) {
  const [search, setSearch] = useState("");

  const filtered = MP_COMMODITIES.filter((c) =>
    c.material.toLowerCase().includes(search.toLowerCase()) ||
    c.proveedor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* A) KPI Cards — 4 expanded */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2.5 flex items-center gap-1.5">
          🏭 Materia Prima — Resumen
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MP_KPI_CARDS.map((c) => (
            <KPICard key={c.label} label={c.label} value={c.value} icon={c.icon} color={c.color} />
          ))}
        </div>
      </div>

      {/* B) Commodities table */}
      <div>
        <div className="flex items-center justify-between px-1 mb-2.5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            📋 Commodities
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-[#F8F9FB]/[0.04] border border-white/[0.06] text-white placeholder:text-slate-500 w-40 sm:w-52 focus:outline-none"
            />
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <Card hover={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Material</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Precio actual</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Última compra</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Proveedor</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((row) => (
                    <tr key={row.material} className="border-b border-white/[0.04] hover:bg-[#F8F9FB]/[0.03] transition-colors">
                      <td className="px-4 py-2.5 text-white font-medium">{row.material}</td>
                      <td className="px-4 py-2.5 text-slate-300">{row.precio}</td>
                      <td className="px-4 py-2.5 text-slate-400 hidden sm:table-cell">{row.ultimaCompra}</td>
                      <td className="px-4 py-2.5 text-slate-400 hidden md:table-cell">{row.proveedor}</td>
                      <td className="px-4 py-2.5 text-right"><EstadoBadge estado={row.estado} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500 text-[11px]">
                      Sin resultados para &ldquo;{search}&rdquo;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* C + D grid: Suppliers panel + Protocol callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* C) Proveedores quick panel */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              🤝 Proveedores
            </div>
            <button
              onClick={() => onNavigate?.("settings")}
              className="text-[10px] text-[#C8A03A] font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              Ver todos &rarr;
            </button>
          </div>
          <Card hover={false} className="p-0 divide-y divide-white/[0.04]">
            {MP_SUPPLIERS.map((s) => (
              <div key={s.name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-[13px] text-white font-medium">{s.name}</div>
                  <div className="text-[10px] text-slate-500">{s.items} materias suministradas</div>
                </div>
                <EstadoBadge estado={s.status} />
              </div>
            ))}
          </Card>
        </div>

        {/* D) Protocolo de Recepción callout */}
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2.5 flex items-center gap-1.5">
            📝 Protocolo de Recepción
          </div>
          <Card hover={false} className="p-5 flex flex-col gap-3 h-[calc(100%-28px)]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C8A03A]/10 border border-[#C8A03A]/[0.19] flex items-center justify-center shrink-0">
                <span className="text-base">📋</span>
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-white mb-1">Protocolo activo</div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  Verificación de calidad, peso, temperatura y documentación al recibir materia prima. Última actualización: 01 Mar 2026.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                5 revisiones pendientes
              </span>
              <span className="text-white/[0.12]">|</span>
              <span>3 completadas hoy</span>
            </div>
            <div className="mt-auto pt-2">
              <button
                onClick={() => onNavigate?.("materia_prima")}
                className="w-full py-2 rounded-lg bg-[#1F2A44] text-white text-[11px] font-semibold border border-[#C8A03A]/[0.19] cursor-pointer hover:bg-[#1F2A44]/80 transition-colors"
              >
                Ver protocolo
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Combustible mock data ─────────────────────────────────── */

const COMB_KPI_CARDS = [
  { label: "Consumo del mes", value: "12.450 L", icon: "⛽", color: "#f59e0b" },
  { label: "Gasto del mes", value: "Gs 8.2M", icon: "💰", color: "#3b82f6" },
  { label: "Costo promedio", value: "Gs 6.580/L", icon: "📈", color: "#22c55e" },
  { label: "Alertas activas", value: 2, icon: "🚨", color: "#ef4444" },
];

const COMB_ACTIVITY = [
  { id: "c1", text: "Carga de 3.200 L diésel — Est. Ypoti", time: "Hace 5 horas", icon: "⛽", tipo: "Diésel" },
  { id: "c2", text: "Alerta: consumo elevado en Est. Lusipar (+18%)", time: "Hace 6 horas", icon: "🚨", tipo: "Alerta" },
  { id: "c3", text: "Carga de 1.800 L gasolina — Est. Cielo Azul", time: "Hace 1 día", icon: "⛽", tipo: "Gasolina" },
  { id: "c4", text: "Mantenimiento tanque completado — Est. Santa Maria", time: "Hace 2 días", icon: "🔧", tipo: "Mantenimiento" },
  { id: "c5", text: "Factura COMB-2026-045 registrada — Petropar", time: "Hace 3 días", icon: "📄", tipo: "Diésel" },
];

function CombustibleView({ onNavigate }) {
  const [periodo, setPeriodo] = useState("mes");
  const [tipoComb, setTipoComb] = useState("todos");
  const [centro, setCentro] = useState("todos");

  const filteredActivity = COMB_ACTIVITY.filter((a) => {
    if (tipoComb === "todos") return true;
    return a.tipo.toLowerCase() === tipoComb;
  });

  return (
    <div className="space-y-5">
      {/* A) KPI Cards */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2.5 flex items-center gap-1.5">
          ⛽ Combustible — Resumen
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COMB_KPI_CARDS.map((c) => (
            <KPICard key={c.label} label={c.label} value={c.value} icon={c.icon} color={c.color} />
          ))}
        </div>
      </div>

      {/* B) Quick filters */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2.5 flex items-center gap-1.5">
          🔍 Filtros
        </div>
        <Card hover={false} className="p-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Período</label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#F8F9FB]/[0.04] border border-white/[0.06] text-white focus:outline-none cursor-pointer"
              >
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
                <option value="trimestre">Trimestre</option>
                <option value="ano">Este año</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tipo</label>
              <select
                value={tipoComb}
                onChange={(e) => setTipoComb(e.target.value)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#F8F9FB]/[0.04] border border-white/[0.06] text-white focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value="diésel">Diésel</option>
                <option value="gasolina">Gasolina</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Centro</label>
              <select
                value={centro}
                onChange={(e) => setCentro(e.target.value)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#F8F9FB]/[0.04] border border-white/[0.06] text-white focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value="ypoti">Ypoti</option>
                <option value="lusipar">Lusipar</option>
                <option value="cielo_azul">Cielo Azul</option>
                <option value="santa_maria">Santa Maria</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* C) Activity feed */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2.5 flex items-center gap-1.5">
          🕐 Actividad reciente
        </div>
        {filteredActivity.length > 0 ? (
          filteredActivity.map((entry) => (
            <Card key={entry.id} hover={false} className="p-3 mb-2">
              <div className="flex gap-3 items-start">
                <span className="text-sm mt-0.5">{entry.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="warning" size="xs">Combustible</Badge>
                    <span className="text-[10px] text-slate-500 bg-[#F8F9FB]/[0.04] px-1.5 py-0.5 rounded">{entry.tipo}</span>
                  </div>
                  <div className="text-sm text-white">{entry.text}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{entry.time}</div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card hover={false} className="p-6 text-center">
            <p className="text-sm text-slate-500">No hay actividad para este filtro</p>
          </Card>
        )}
      </div>

      {/* D) Quick action */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2.5 flex items-center gap-1.5">
          ⚡ Acciones rápidas
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card hover={false} className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/[0.19] flex items-center justify-center shrink-0">
              <span className="text-base">⛽</span>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-white mb-1">Registrar carga</div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                Ingresar nueva carga de combustible con volumen, proveedor y centro de costo.
              </div>
            </div>
          </Card>
          <Card hover={false} className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/[0.19] flex items-center justify-center shrink-0">
              <span className="text-base">📊</span>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-white mb-1">Ver reportes</div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                Consumo por establecimiento, tendencia mensual y comparativo de costos.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */

export default function PanelGeneral({ onNavigate, initialModule }) {
  const [activeModule, setActiveModule] = useState(initialModule || "todos");

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
          Visión consolidada de los módulos
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

      {/* Module-specific expanded views */}
      {activeModule === "materia_prima" ? (
        <MateriaPrimaView onNavigate={onNavigate} />
      ) : activeModule === "combustible" ? (
        <CombustibleView onNavigate={onNavigate} />
      ) : (
        <>
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
                  No hay actividad reciente para este módulo
                </p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
