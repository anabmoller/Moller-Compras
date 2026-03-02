// ============================================================
// YPOTI -- Budget Management Screen (Admin)
// Phase 7 -- Async CRUD via Supabase-backed budgets.js
// ============================================================
import { useState, useCallback, useMemo } from "react";
import { getEstablishments, getSectors } from "../../constants/parameters";
import {
  getBudgets, addBudget, updateBudget, initBudgets,
} from "../../constants/budgets";
import BackButton from "../common/BackButton";
import PageHeader from "../common/PageHeader";
import ModalBackdrop from "../common/ModalBackdrop";
import BudgetSummaryCard from "./BudgetSummaryCard";
import BudgetGroupList from "./BudgetGroupList";
import BudgetFormModal from "./BudgetFormModal";

const DEFAULT_FORM = {
  name: "", establishment: "", sector: "", period: "2026",
  startDate: "2026-01-01", endDate: "2026-12-31",
  planned: 0, consumed: 0,
  proyecto: "", centroCostos: "", splitEnabled: false, splits: {},
};

export default function BudgetManagementScreen({ onBack }) {
  const [budgets, setBudgets] = useState(() => getBudgets());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterEst, setFilterEst] = useState("all");
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });

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
          name: form.name, establishment: form.establishment, sector: form.sector,
          period: form.period, startDate: form.startDate, endDate: form.endDate,
          planned: Number(form.planned), consumed: Number(form.consumed),
        });
      } else {
        await addBudget({
          name: form.name, establishment: form.establishment, sector: form.sector,
          period: form.period, startDate: form.startDate, endDate: form.endDate,
          planned: Number(form.planned), consumed: Number(form.consumed),
        });
      }
      refresh();
      setShowForm(false);
      setEditingId(null);
      setForm({ ...DEFAULT_FORM });
    } catch (err) {
      console.error("[Budget] Save failed:", err);
      setActionError("Error al guardar presupuesto: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (budget) => {
    setForm({
      name: budget.name, establishment: budget.establishment, sector: budget.sector,
      period: budget.period, startDate: budget.startDate, endDate: budget.endDate,
      planned: budget.planned, consumed: budget.consumed,
      proyecto: "", centroCostos: "", splitEnabled: false, splits: {},
    });
    setEditingId(budget.id);
    setShowForm(true);
  };

  const handleDeactivate = async (id) => {
    setSaving(true);
    try {
      await updateBudget(id, { active: false });
      refresh();
      setShowForm(false);
      setEditingId(null);
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
          <button onClick={() => setActionError(null)} className="bg-none border-none cursor-pointer text-sm text-red-400 px-1">{"✕"}</button>
        </div>
      )}

      {/* Summary card */}
      <BudgetSummaryCard
        totalPlanned={totalPlanned}
        totalConsumed={totalConsumed}
        totalPercent={totalPercent}
      />

      {/* Filter + Actions */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 items-center">
          <select
            value={filterEst}
            onChange={e => setFilterEst(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-[13px] text-white outline-none"
          >
            <option value="all">Todos los establecimientos</option>
            {establishments.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ ...DEFAULT_FORM });
              setShowForm(true);
            }}
            className="bg-gradient-to-br from-emerald-500 to-[#C8A03A] text-white border-none rounded-lg px-4 py-2.5 text-xs font-semibold cursor-pointer whitespace-nowrap shadow-md shadow-emerald-500/20"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* Budget list by establishment */}
      <BudgetGroupList
        grouped={grouped}
        filterEst={filterEst}
        onEdit={handleEdit}
      />

      {/* Reset button */}
      <div className="px-5 pt-4">
        <button
          onClick={() => setShowConfirmReset(true)}
          disabled={saving}
          className={`w-full p-3 rounded-lg border border-white/[0.06] bg-[#F8F9FB]/[0.02] text-slate-400 text-xs font-medium ${saving ? 'cursor-default' : 'cursor-pointer'}`}
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
              Se recargar{"á"}n todos los presupuestos desde el servidor.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-3 rounded-lg border border-white/[0.06] bg-[#F8F9FB]/[0.03] text-white text-[13px] font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                className={`flex-1 py-3 rounded-lg border-none bg-[#1F2A44] text-white text-[13px] font-semibold ${saving ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {saving ? "Cargando..." : "Refrescar"}
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <BudgetFormModal
          form={form}
          editingId={editingId}
          establishments={establishments}
          sectors={sectors}
          saving={saving}
          onUpdate={update}
          onSave={handleSave}
          onDeactivate={handleDeactivate}
          onClose={() => { setShowForm(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}
