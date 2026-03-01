// ============================================================
// YPOTI — Budget Management Screen (Admin)
// Phase 7 — Async CRUD via Supabase-backed budgets.js
// ============================================================
import { useState, useEffect, useCallback, useMemo } from "react";
import { getEstablishments, getSectors } from "../../constants/parameters";
import {
  getBudgets, addBudget, updateBudget, initBudgets,
  getBudgetPercent, getBudgetRemaining,
  formatGuaranies,
} from "../../constants/budgets";
import BackButton from "../common/BackButton";
import PageHeader from "../common/PageHeader";
import ModalBackdrop from "../common/ModalBackdrop";

export default function BudgetManagementScreen({ onBack }) {
  const [budgets, setBudgets] = useState(() => getBudgets());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterEst, setFilterEst] = useState("all");
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [form, setForm] = useState({
    name: "", establishment: "", sector: "", period: "2026",
    startDate: "2026-01-01", endDate: "2026-12-31",
    planned: 0, consumed: 0,
  });

  const establishments = useMemo(() => getEstablishments().map(e => e.name), []);
  const sectors = useMemo(() => getSectors().map(s => s.name), []);

  const refresh = useCallback(() => setBudgets([...getBudgets()]), []);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const filtered = filterEst === "all"
    ? budgets.filter(b => b.active)
    : budgets.filter(b => b.active && b.establishment === filterEst);

  const grouped = {};
  filtered.forEach(b => {
    if (!grouped[b.establishment]) grouped[b.establishment] = [];
    grouped[b.establishment].push(b);
  });

  const totalPlanned = filtered.reduce((s, b) => s + b.planned, 0);
  const totalConsumed = filtered.reduce((s, b) => s + b.consumed, 0);
  const totalPercent = totalPlanned > 0 ? Math.round((totalConsumed / totalPlanned) * 100) : 0;

  const handleSave = async () => {
    if (!form.name || !form.establishment || !form.planned) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateBudget(editingId, {
          name: form.name,
          establishment: form.establishment,
          sector: form.sector,
          period: form.period,
          startDate: form.startDate,
          endDate: form.endDate,
          planned: Number(form.planned),
          consumed: Number(form.consumed),
        });
      } else {
        await addBudget({
          name: form.name,
          establishment: form.establishment,
          sector: form.sector,
          period: form.period,
          startDate: form.startDate,
          endDate: form.endDate,
          planned: Number(form.planned),
          consumed: Number(form.consumed),
        });
      }
      refresh();
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", establishment: "", sector: "", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 0, consumed: 0 });
    } catch (err) {
      console.error("[Budget] Save failed:", err);
      setActionError("Error al guardar presupuesto: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (budget) => {
    setForm({
      name: budget.name,
      establishment: budget.establishment,
      sector: budget.sector,
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
      planned: budget.planned,
      consumed: budget.consumed,
    });
    setEditingId(budget.id);
    setShowForm(true);
  };

  const handleDeactivate = async (id) => {
    setSaving(true);
    try {
      await updateBudget(id, { active: false });
      refresh();
    } catch (err) {
      console.error("[Budget] Deactivate failed:", err);
      setActionError("Error al desactivar: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await initBudgets();
      refresh();
      setShowConfirmReset(false);
    } catch (err) {
      console.error("[Budget] Reset failed:", err);
      setActionError("Error al recargar: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const barColor = (pct) => pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';

  return (
    <div className="pb-10 animate-fadeIn">
      {/* Header */}
      <BackButton onClick={onBack} />
      <PageHeader
        title="Presupuestos"
        subtitle="Gestión de presupuestos por establecimiento y sector"
      />

      {/* Error banner */}
      {actionError && (
        <div className="mx-5 mb-3 px-3.5 py-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/[0.19] flex justify-between items-center">
          <span className="text-xs text-red-400 font-medium">{actionError}</span>
          <button onClick={() => setActionError(null)} className="bg-none border-none cursor-pointer text-sm text-red-400 px-1">✕</button>
        </div>
      )}

      {/* Summary card */}
      <div className="px-5 mb-4">
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06] shadow-sm">
          <div className="flex justify-between mb-2.5">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Total General
              </div>
              <div className="text-lg font-bold text-white mt-0.5">
                {formatGuaranies(totalPlanned)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Consumido
              </div>
              <div className="text-lg font-bold mt-0.5" style={{ color: barColor(totalPercent) }}>
                {totalPercent}%
              </div>
            </div>
          </div>
          <div className="bg-[#0a0b0f] rounded h-2 overflow-hidden border border-white/[0.06]">
            <div
              className="h-full rounded transition-all duration-500"
              style={{ width: `${Math.min(totalPercent, 100)}%`, background: barColor(totalPercent) }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
            <span>{formatGuaranies(totalConsumed)} consumido</span>
            <span>{formatGuaranies(totalPlanned - totalConsumed)} restante</span>
          </div>
        </div>
      </div>

      {/* Filter + Actions */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 items-center">
          <select
            value={filterEst}
            onChange={e => setFilterEst(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-[13px] text-white outline-none"
          >
            <option value="all">Todos los establecimientos</option>
            {establishments.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", establishment: "", sector: "", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 0, consumed: 0 });
              setShowForm(true);
            }}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-lg px-4 py-2.5 text-xs font-semibold cursor-pointer whitespace-nowrap shadow-md shadow-emerald-500/20"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* Budget list by establishment */}
      <div className="px-5">
        {Object.entries(grouped).map(([est, items]) => {
          const estTotal = items.reduce((s, b) => s + b.planned, 0);
          const estConsumed = items.reduce((s, b) => s + b.consumed, 0);
          const estPct = estTotal > 0 ? Math.round((estConsumed / estTotal) * 100) : 0;
          return (
            <div key={est} className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[13px] font-bold text-white uppercase tracking-wide">
                  📍 {est}
                </div>
                <div className="text-[11px] font-semibold" style={{ color: barColor(estPct) }}>
                  {formatGuaranies(estConsumed)} / {formatGuaranies(estTotal)} ({estPct}%)
                </div>
              </div>

              {items.map(b => {
                const pct = getBudgetPercent(b);
                const remaining = getBudgetRemaining(b);
                return (
                  <div
                    key={b.id}
                    onClick={() => handleEdit(b)}
                    className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06] mb-2 cursor-pointer transition-all duration-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <div className="text-[13px] font-semibold text-white">
                          {b.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-px">
                          {b.sector} · {b.period}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold" style={{ color: barColor(pct) }}>
                          {pct}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatGuaranies(remaining)} libre
                        </div>
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    <div className="bg-[#0a0b0f] rounded h-[5px] overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{ width: `${Math.min(pct, 100)}%`, background: barColor(pct) }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{formatGuaranies(b.consumed)}</span>
                      <span>{formatGuaranies(b.planned)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {Object.keys(grouped).length === 0 && (
          <div className="text-center p-10 text-slate-400 text-[13px]">
            No hay presupuestos activos
            {filterEst !== "all" ? ` para ${filterEst}` : ""}
          </div>
        )}
      </div>

      {/* Reset button */}
      <div className="px-5 pt-4">
        <button
          onClick={() => setShowConfirmReset(true)}
          disabled={saving}
          className={`w-full p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-slate-400 text-xs font-medium ${saving ? 'cursor-default' : 'cursor-pointer'}`}
        >
          Refrescar presupuestos desde servidor
        </button>
      </div>

      {/* Confirm reset modal */}
      {showConfirmReset && (
        <ModalBackdrop onClose={() => setShowConfirmReset(false)} variant="center">
          <div className="bg-[#111218] rounded-2xl p-6 max-w-[340px] w-full">
            <div className="text-base font-bold text-white mb-2">
              Refrescar presupuestos
            </div>
            <div className="text-[13px] text-slate-400 mb-5 leading-relaxed">
              Se recargarán todos los presupuestos desde el servidor.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white text-[13px] font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                className={`flex-1 py-3 rounded-lg border-none bg-emerald-500 text-white text-[13px] font-semibold ${saving ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {saving ? "Cargando..." : "Refrescar"}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <ModalBackdrop onClose={() => { setShowForm(false); setEditingId(null); }}>
          <div className="bg-[#111218] rounded-t-2xl px-5 pt-5 pb-10 max-w-[480px] w-full max-h-[85vh] overflow-y-auto animate-fadeIn">
            <div className="w-10 h-1 bg-white/[0.06] rounded mx-auto mb-4" />

            <h3 className="text-xl font-semibold text-white mb-4 mt-0">
              {editingId ? "Editar Presupuesto" : "Nuevo Presupuesto"}
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Nombre</label>
                <input
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="Ej: Taller Ypoti"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Establecimiento</label>
                  <select
                    value={form.establishment}
                    onChange={e => update("establishment", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                  >
                    <option value="">Seleccionar...</option>
                    {establishments.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Sector</label>
                  <select
                    value={form.sector}
                    onChange={e => update("sector", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                  >
                    <option value="">Seleccionar...</option>
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Período</label>
                  <input
                    value={form.period}
                    onChange={e => update("period", e.target.value)}
                    placeholder="2026"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Inicio</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => update("startDate", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Fin</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => update("endDate", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Monto Planificado (₲)</label>
                  <input
                    type="number"
                    value={form.planned || ""}
                    onChange={e => update("planned", parseInt(e.target.value) || 0)}
                    placeholder="100000000"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                    min={0}
                  />
                  {form.planned > 0 && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {formatGuaranies(form.planned)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Consumido (₲)</label>
                  <input
                    type="number"
                    value={form.consumed || ""}
                    onChange={e => update("consumed", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
                    min={0}
                  />
                  {form.consumed > 0 && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {formatGuaranies(form.consumed)}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                {editingId && (
                  <button
                    onClick={async () => {
                      await handleDeactivate(editingId);
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    disabled={saving}
                    className={`px-4 py-3 rounded-lg border border-red-500/[0.12] bg-red-500/[0.06] text-red-400 text-xs font-semibold ${saving ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    Desactivar
                  </button>
                )}
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex-1 py-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white text-[13px] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || !form.establishment || !form.planned || saving}
                  className={`flex-1 py-3 rounded-lg border-none text-[13px] font-semibold ${
                    form.name && form.establishment && form.planned && !saving
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white cursor-pointer shadow-md shadow-emerald-500/20'
                      : 'bg-white/[0.06] text-slate-500 cursor-default'
                  }`}
                >
                  {saving ? "Guardando..." : editingId ? "Guardar" : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}
