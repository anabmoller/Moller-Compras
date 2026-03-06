import { useState, useEffect, useMemo, useCallback } from "react";
import { Users, Truck, AlertTriangle, Scale, LayoutList } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { isSuperAdmin } from "../../lib/permissions";
import { fetchHatoData, getCategorias, initGanado } from "../../constants/ganado";
import { getEstablishments } from "../../constants/parameters";
import { BullIcon } from "../icons";
import Badge from "../shared/Badge";
import SearchInput from "../common/SearchInput";
import HaciendaKpiCard from "./HaciendaKpiCard";

// ─── Movement estado → UI badge ────────────────────────────
const ESTADO_MAP = {
  borrador:              { label: "Borrador",       variant: "default" },
  pendiente_validacion:  { label: "Pendiente",      variant: "warning" },
  validado:              { label: "Validado",        variant: "info"    },
  en_transito:           { label: "En tránsito",    variant: "purple"  },
  recibido:              { label: "Recibido",        variant: "success" },
  cerrado:               { label: "Cerrado",         variant: "default" },
};

// ─── Movement tipo → icon + color ──────────────────────────
const TIPO_MAP = {
  compra:                 { label: "Compra",         icon: "↓", color: "#22c55e" },
  venta:                  { label: "Venta",          icon: "↑", color: "#ef4444" },
  transferencia_interna:  { label: "Transferencia",  icon: "⇄", color: "#3b82f6" },
  consignacion:           { label: "Consignación",   icon: "⇥", color: "#f59e0b" },
};

const TIPO_OPTIONS = ["todos", "compra", "venta", "transferencia_interna", "consignacion"];
const ESTAB_COLORS = ["#C8A03A", "#8b5cf6", "#3b82f6", "#22c55e", "#ef4444", "#f97316", "#06b6d4", "#ec4899", "#64748b", "#a3e635"];

// ─── Helpers ───────────────────────────────────────────────
const fmtDate = d => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const fmtNum = n => (n != null && n > 0) ? n.toLocaleString("es-PY") : "—";

function buildEstabLookup() {
  const list = getEstablishments();
  const map = {};
  for (const e of list) {
    map[e._uuid] = e.name;
    if (e.id) map[e.id] = e.name;
  }
  return { list, map };
}

// ─── Sidebar panels ────────────────────────────────────────
function EstabPanel({ data }) {
  const total = data.reduce((s, e) => s + e.count, 0) || 1;
  return (
    <div className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl p-5">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-3.5">
        Hato por Establecimiento
      </div>
      <div className="flex rounded overflow-hidden h-[7px] mb-4">
        {data.map((e, i) => (
          <div key={e.name} style={{ flex: e.count / total, background: ESTAB_COLORS[i % ESTAB_COLORS.length] }} />
        ))}
      </div>
      {data.map((e, i) => (
        <div key={e.name} className="flex items-center gap-2 mb-2">
          <div className="w-[9px] h-[9px] rounded-sm shrink-0" style={{ background: ESTAB_COLORS[i % ESTAB_COLORS.length] }} />
          <span className="text-[13px] text-slate-300 flex-1 truncate">{e.name}</span>
          <span className="text-xs text-slate-500 font-mono">{fmtNum(e.count)}</span>
        </div>
      ))}
    </div>
  );
}

function CatPanel({ data }) {
  const max = Math.max(...data.map(c => c.count), 1);
  return (
    <div className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl p-5">
      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-3.5">
        Hato por Categoría
      </div>
      {data.map(c => (
        <div key={c.name} className="flex items-center gap-2 mb-2.5">
          <span className="text-[13px] text-slate-300 flex-1">{c.name}</span>
          <div className="flex-[2] h-1 bg-white/[0.06] rounded overflow-hidden">
            <div className="h-full bg-[#C8A03A] rounded" style={{ width: `${(c.count / max) * 100}%` }} />
          </div>
          <span className="text-xs text-slate-500 font-mono min-w-[24px] text-right">{fmtNum(c.count)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Movement Detail Drawer ────────────────────────────────
function MovDrawer({ mov, estabMap, catMap, onClose }) {
  if (!mov) return null;
  const tipo = TIPO_MAP[mov.tipoOperacion] || { label: mov.tipoOperacion, icon: "?", color: "#64748b" };
  const estado = ESTADO_MAP[mov.estado] || ESTADO_MAP.borrador;
  const origenName = estabMap[mov.establecimientoOrigenId] || "—";
  const destName = mov.destinoNombre || estabMap[mov.establecimientoDestinoId] || "—";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[199]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[380px] bg-[var(--color-sidebar-bg)] border-l border-[var(--color-border)] shadow-[-6px_0_32px_rgba(0,0,0,0.15)] flex flex-col z-[200] overflow-y-auto">
        {/* Header */}
        <div className="bg-[var(--color-surface)] px-6 py-[22px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] font-mono mb-1" style={{ color: tipo.color }}>
                {tipo.icon} {tipo.label}
              </div>
              <div className="text-[22px] font-bold text-[var(--color-text)] leading-none">{mov.id || "—"}</div>
              <div className="text-[13px] text-slate-400 mt-1">
                Guía: {mov.nroGuia || "—"} · Cota: {mov.nroCota || "—"}
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-[var(--color-surface-hover)] border-none text-slate-400 w-8 h-8 rounded-[7px] cursor-pointer text-base flex items-center justify-center hover:bg-[var(--color-surface)] transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="mt-3.5">
            <Badge variant={estado.variant} dot>{estado.label}</Badge>
          </div>
        </div>

        <div className="p-[22px] flex flex-col gap-5">
          {/* Data grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ["Fecha emisión",  fmtDate(mov.fechaEmision)],
              ["Finalidad",      mov.finalidad || "—"],
              ["Origen",         origenName],
              ["Destino",        destName],
              ["Cantidad total", `${mov.cantidadTotal} cab.`],
              ["Peso total",     mov.pesoTotalKg > 0 ? `${fmtNum(mov.pesoTotalKg)} kg` : "—"],
              ["Precio/kg",      mov.precioPorKg > 0 ? `${fmtNum(mov.precioPorKg)} ${mov.moneda || ""}` : "—"],
              ["Precio total",   mov.precioTotal > 0 ? `${fmtNum(mov.precioTotal)} ${mov.moneda || ""}` : "—"],
            ].map(([l, v]) => (
              <div key={l} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2.5">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{l}</div>
                <div className="text-[13px] font-mono font-medium text-[var(--color-text)]">{v}</div>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          {mov.categorias?.length > 0 && (
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-3">
                Desglose por Categoría
              </div>
              {mov.categorias.map((c, i) => {
                const cat = catMap[c.categoriaId];
                return (
                  <div key={c.id || i} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
                    <span className="text-[13px] text-slate-400 flex-1">
                      {cat?.codigo || cat?.nombre || c.categoriaId?.slice?.(0, 8) || "—"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{c.cantidad} cab.</span>
                    <span className="text-xs text-slate-500 font-mono">{c.pesoKg > 0 ? `${fmtNum(c.pesoKg)} kg` : "—"}</span>
                    <span className="text-xs text-slate-600 font-mono">
                      {c.pesoPromedioKg > 0 ? `~${Math.round(c.pesoPromedioKg)} kg/cab` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {mov.observaciones && (
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">Observaciones</div>
              <div className="text-[13px] text-slate-400">{mov.observaciones}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────
export default function RebanhoAtivo() {
  const { currentUser } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]             = useState("");
  const [filterTipo, setFilterTipo]     = useState("todos");
  const [filterEstab, setFilterEstab]   = useState("todos");
  const [sortBy, setSortBy]             = useState("fechaEmision");
  const [sortDir, setSortDir]           = useState("desc");
  const [selected, setSelected]         = useState(null);

  // Establishment lookup
  const { list: estabList, map: estabMap } = useMemo(() => buildEstabLookup(), []);
  const isAdmin = useMemo(() => isSuperAdmin(currentUser), [currentUser]);

  // Scope: admin → all; normal user → their establishment
  const scopedEstabId = useMemo(() => {
    if (isAdmin) return null;
    if (!currentUser?.establishment) return null;
    const match = estabList.find(e =>
      e.name === currentUser.establishment || e.code === currentUser.establishment
    );
    return match?._uuid || null;
  }, [currentUser, estabList, isAdmin]);

  // Category lookup
  const [catMap, setCatMap] = useState({});

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure categories are loaded
      if (getCategorias().length === 0) await initGanado();
      const cm = {};
      for (const c of getCategorias()) cm[c.id] = c;
      setCatMap(cm);

      // Fetch all non-anulado movements with category details
      const data = await fetchHatoData({
        establishmentId: scopedEstabId || undefined,
      });
      setMovements(data);
    } catch (err) {
      console.error("[RebanhoAtivo] fetch error:", err?.message || err);
      setMovements([]);
    }
    setLoading(false);
  }, [scopedEstabId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── KPIs: derive herd from movement balances ──
  const kpis = useMemo(() => {
    let totalEntradas = 0;
    let totalSalidas = 0;
    let enTransito = 0;
    let pesoTotalKg = 0;
    let cantidadConPeso = 0;

    for (const m of movements) {
      const qty = m.cantidadTotal;
      const peso = m.pesoTotalKg;

      if (m.tipoOperacion === "compra") {
        totalEntradas += qty;
      } else if (m.tipoOperacion === "venta") {
        totalSalidas += qty;
      }
      // Transfers are internal — net zero at global level

      if (m.estado === "en_transito") {
        enTransito += qty;
      }

      if (peso > 0 && qty > 0) {
        pesoTotalKg += peso;
        cantidadConPeso += qty;
      }
    }

    const hatoNeto = Math.max(0, totalEntradas - totalSalidas);
    const pesoMedio = cantidadConPeso > 0 ? Math.round(pesoTotalKg / cantidadConPeso) : 0;

    // Alerts: movements pending validation > 7 days
    const now = Date.now();
    const alertas = movements.filter(m => {
      if (m.estado !== "pendiente_validacion") return false;
      return (now - new Date(m.createdAt)) > 7 * 86400000;
    }).length;

    return { totalEntradas, totalSalidas, hatoNeto, enTransito, pesoMedio, alertas, totalMovimientos: movements.length };
  }, [movements]);

  // ── Per-establishment distribution (net herd) ──
  const estabData = useMemo(() => {
    const counts = {};
    const ensure = (id) => {
      if (!id) return;
      if (!counts[id]) counts[id] = { id, name: estabMap[id] || id.slice(0, 8), count: 0 };
    };

    for (const m of movements) {
      const qty = m.cantidadTotal;
      const oid = m.establecimientoOrigenId;
      const did = m.establecimientoDestinoId;

      if (m.tipoOperacion === "compra" && oid) {
        ensure(oid);
        counts[oid].count += qty;
      } else if (m.tipoOperacion === "venta" && oid) {
        ensure(oid);
        counts[oid].count -= qty;
      } else if (m.tipoOperacion === "transferencia_interna") {
        if (oid) { ensure(oid); counts[oid].count -= qty; }
        if (did) { ensure(did); counts[did].count += qty; }
      } else if (m.tipoOperacion === "consignacion" && did) {
        ensure(did);
        counts[did].count += qty;
      }
    }

    return Object.values(counts).filter(e => e.count > 0).sort((a, b) => b.count - a.count);
  }, [movements, estabMap]);

  // ── Per-category distribution (net herd) ──
  const catData = useMemo(() => {
    const counts = {};
    for (const m of movements) {
      const sign = m.tipoOperacion === "venta" ? -1 : (m.tipoOperacion === "transferencia_interna" ? 0 : 1);
      if (sign === 0) continue; // transfers net zero at global category level
      for (const c of (m.categorias || [])) {
        const cat = catMap[c.categoriaId];
        const name = cat?.codigo || cat?.nombre || "Sin categoría";
        if (!counts[name]) counts[name] = { name, count: 0 };
        counts[name].count += (c.cantidad || 0) * sign;
      }
    }
    return Object.values(counts).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
  }, [movements, catMap]);

  // ── Establishment filter options ──
  const estabOptions = useMemo(() => {
    const names = new Set();
    for (const m of movements) {
      const n = estabMap[m.establecimientoOrigenId];
      if (n) names.add(n);
    }
    return ["todos", ...Array.from(names).sort()];
  }, [movements, estabMap]);

  // ── Filtered & sorted list ──
  const filtered = useMemo(() => {
    return movements
      .filter(m => {
        if (filterTipo !== "todos" && m.tipoOperacion !== filterTipo) return false;
        if (filterEstab !== "todos") {
          const loc = estabMap[m.establecimientoOrigenId] || "";
          if (loc !== filterEstab) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          const fields = [m.id, m.nroGuia, m.nroCota, estabMap[m.establecimientoOrigenId], m.destinoNombre];
          if (!fields.some(f => f?.toLowerCase?.().includes(q))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let va = a[sortBy], vb = b[sortBy];
        if (va == null) va = "";
        if (vb == null) vb = "";
        if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
        va = (va + "").toLowerCase();
        vb = (vb + "").toLowerCase();
        return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
  }, [movements, filterTipo, filterEstab, search, sortBy, sortDir, estabMap]);

  const toggleSort = col => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir(col === "fechaEmision" || col === "cantidadTotal" || col === "pesoTotalKg" ? "desc" : "asc"); }
  };

  const COLS = [
    ["id",                      "Nro"],
    ["nroGuia",                 "Guía"],
    ["fechaEmision",            "Fecha"],
    ["tipoOperacion",           "Tipo"],
    ["establecimientoOrigenId", "Establecimiento"],
    ["cantidadTotal",           "Cantidad"],
    ["pesoTotalKg",             "Peso kg"],
  ];

  return (
    <div>
      {/* KPIs */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <HaciendaKpiCard label="Hato estimado" value={fmtNum(kpis.hatoNeto)} sub="compras − ventas" icon={<Users size={18} />} color="#22c55e" loading={loading} />
        <HaciendaKpiCard label="En tránsito" value={kpis.enTransito} sub="guía abierta" icon={<Truck size={18} />} color="#C8A03A" loading={loading} />
        <HaciendaKpiCard label="Alertas" value={kpis.alertas} sub="pend. validación >7d" icon={<AlertTriangle size={18} />} color="#ef4444" loading={loading} />
        <HaciendaKpiCard label="Peso medio" value={kpis.pesoMedio > 0 ? `${kpis.pesoMedio} kg` : "—"} sub="prom. movimientos" icon={<Scale size={18} />} color="#8b5cf6" loading={loading} />
        <HaciendaKpiCard label="Total movimientos" value={kpis.totalMovimientos} sub="excl. anulados" icon={<LayoutList size={18} />} color="#64748b" loading={loading} />
      </div>

      {/* Alert banner */}
      {!loading && kpis.alertas > 0 && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-2.5 flex items-center gap-2.5 mb-4">
          <AlertTriangle size={15} className="text-red-400 shrink-0" />
          <span className="text-[13px] text-red-400">
            <strong>{kpis.alertas} movimiento{kpis.alertas > 1 ? "s" : ""}</strong> pendiente{kpis.alertas > 1 ? "s" : ""} de validación hace más de 7 días
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 rounded-lg bg-[#1F2A44] inline-flex items-center justify-center shadow-lg shadow-black/20 animate-pulse mb-3 text-white">
            <BullIcon size={16} />
          </div>
          <p className="text-slate-500 text-sm">Cargando hato...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && movements.length === 0 && (
        <div className="text-center py-16">
          <div className="mb-3 text-slate-500"><BullIcon size={40} /></div>
          <p className="text-slate-400 text-sm mb-1">No hay movimientos registrados</p>
          <p className="text-slate-600 text-xs">El inventario del hato se deriva de los movimientos de compra, venta y transferencia</p>
        </div>
      )}

      {/* Main content — sidebar + table */}
      {!loading && movements.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr] gap-3.5 items-start">
          <div className="flex flex-col gap-3">
            <EstabPanel data={estabData} />
            <CatPanel data={catData} />
          </div>

          <div className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
            {/* Filters row */}
            <div className="p-3.5 border-b border-white/[0.06] flex gap-2.5 flex-wrap items-center">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar guía, nro, establecimiento…"
                className="flex-1 min-w-[180px]"
              />
              <select
                value={filterTipo}
                onChange={e => setFilterTipo(e.target.value)}
                className="bg-[#F8F9FB]/[0.05] border border-white/[0.1] text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#C8A03A]/50"
              >
                {TIPO_OPTIONS.map(t => (
                  <option key={t} value={t}>{t === "todos" ? "Todos los tipos" : TIPO_MAP[t]?.label || t}</option>
                ))}
              </select>
              <select
                value={filterEstab}
                onChange={e => setFilterEstab(e.target.value)}
                className="bg-[#F8F9FB]/[0.05] border border-white/[0.1] text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#C8A03A]/50"
              >
                {estabOptions.map(l => <option key={l} value={l}>{l === "todos" ? "Todos los locales" : l}</option>)}
              </select>
              <span className="text-[11px] text-slate-500 font-mono">
                {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FB]/[0.05]">
                    {COLS.map(([col, label]) => (
                      <th
                        key={col}
                        onClick={() => toggleSort(col)}
                        className="px-3.5 py-3 text-left text-[11px] text-slate-500 uppercase tracking-wide font-semibold border-b border-white/[0.06] cursor-pointer select-none whitespace-nowrap"
                      >
                        {label}
                        <span className={`ml-1 ${sortBy === col ? "text-[#C8A03A]" : "text-slate-600"}`}>
                          {sortBy === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                        </span>
                      </th>
                    ))}
                    <th className="px-3.5 py-3 text-left text-[11px] text-slate-500 uppercase tracking-wide font-semibold border-b border-white/[0.06]">
                      Estado
                    </th>
                    <th className="px-3.5 py-3 border-b border-white/[0.06]" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-9 text-center text-[13px] text-slate-500">
                        Ningún movimiento con esos filtros
                      </td>
                    </tr>
                  )}
                  {filtered.map((m, i) => {
                    const tipo = TIPO_MAP[m.tipoOperacion] || { label: m.tipoOperacion, icon: "?", color: "#64748b" };
                    const estado = ESTADO_MAP[m.estado] || ESTADO_MAP.borrador;
                    const origenName = estabMap[m.establecimientoOrigenId] || "—";
                    const isSel = selected?._uuid === m._uuid;

                    return (
                      <tr
                        key={m._uuid}
                        onClick={() => setSelected(isSel ? null : m)}
                        className={`border-b border-white/[0.06] cursor-pointer transition-colors ${
                          isSel
                            ? "bg-[#1F2A44]/[0.08]"
                            : i % 2 === 0
                              ? "bg-transparent hover:bg-[#1F2A44]/[0.04]"
                              : "bg-[#F8F9FB]/[0.02] hover:bg-[#1F2A44]/[0.04]"
                        }`}
                      >
                        <td className="px-3.5 py-2.5">
                          <span className="font-mono text-[13px] text-[#C8A03A] font-medium">{m.id || "—"}</span>
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[13px] text-slate-300">{m.nroGuia || "—"}</td>
                        <td className="px-3.5 py-2.5 text-[13px] text-slate-400">{fmtDate(m.fechaEmision)}</td>
                        <td className="px-3.5 py-2.5">
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: tipo.color }}>
                            {tipo.icon} {tipo.label}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-[13px] text-slate-300">{origenName}</td>
                        <td className="px-3.5 py-2.5 font-mono text-[13px] text-slate-200 font-medium">
                          {fmtNum(m.cantidadTotal)}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[13px] text-slate-400">
                          {m.pesoTotalKg > 0 ? fmtNum(m.pesoTotalKg) : "—"}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <Badge variant={estado.variant} dot>{estado.label}</Badge>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <button
                            onClick={e => { e.stopPropagation(); setSelected(isSel ? null : m); }}
                            className="bg-transparent border border-white/[0.08] rounded-md px-2.5 py-1 text-[12px] text-slate-400 cursor-pointer hover:bg-[#F8F9FB]/[0.06] hover:text-slate-300 transition-colors whitespace-nowrap"
                          >
                            Ver detalle →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <MovDrawer mov={selected} estabMap={estabMap} catMap={catMap} onClose={() => setSelected(null)} />
    </div>
  );
}
