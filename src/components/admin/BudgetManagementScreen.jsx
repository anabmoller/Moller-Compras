// ============================================================
// YPOTI — Budget Management Screen (Admin)
// Phase 7 — Async CRUD via Supabase-backed budgets.js
// ============================================================
import { useState, useEffect, useCallback, useMemo } from "react";
import { colors, font, fontDisplay, labelStyle, inputStyle, shadows, radius } from "../../styles/theme";
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

  // Group by establishment
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
      await initBudgets(); // Refresh from Supabase
      refresh();
      setShowConfirmReset(false);
    } catch (err) {
      console.error("[Budget] Reset failed:", err);
      setActionError("Error al recargar: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const barColor = (pct) => pct >= 90 ? colors.danger : pct >= 70 ? colors.warning : colors.success;

  return (
    <div style={{ padding: "0 0 40px", animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <BackButton onClick={onBack} />
      <PageHeader
        title="Presupuestos"
        subtitle="Gestión de presupuestos por establecimiento y sector"
      />

      {/* Error banner */}
      {actionError && (
        <div style={{
          margin: "0 20px 12px", padding: "10px 14px", borderRadius: radius.md,
          background: colors.danger + "10", border: `1px solid ${colors.danger}30`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: colors.danger, fontWeight: 500 }}>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 14, color: colors.danger, padding: "0 4px",
          }}>✕</button>
        </div>
      )}

      {/* Summary card */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div style={{
          background: colors.card, borderRadius: radius.lg, padding: 16,
          border: `1px solid ${colors.borderLight}`,
          boxShadow: shadows.card,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, textTransform: "uppercase", letterSpacing: 1 }}>
                Total General
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginTop: 2 }}>
                {formatGuaranies(totalPlanned)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, textTransform: "uppercase", letterSpacing: 1 }}>
                Consumido
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: barColor(totalPercent), marginTop: 2 }}>
                {totalPercent}%
              </div>
            </div>
          </div>
          <div style={{
            background: colors.bg, borderRadius: radius.sm, height: 8,
            overflow: "hidden", border: `1px solid ${colors.borderLight}`,
          }}>
            <div style={{
              height: "100%", width: `${Math.min(totalPercent, 100)}%`,
              background: barColor(totalPercent), borderRadius: radius.sm,
              transition: "width 0.5s",
            }} />
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 11, color: colors.textLight, marginTop: 6,
          }}>
            <span>{formatGuaranies(totalConsumed)} consumido</span>
            <span>{formatGuaranies(totalPlanned - totalConsumed)} restante</span>
          </div>
        </div>
      </div>

      {/* Filter + Actions */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={filterEst}
            onChange={e => setFilterEst(e.target.value)}
            style={{ ...inputStyle, flex: 1, fontSize: 13 }}
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
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              color: "#fff", border: "none", borderRadius: radius.md,
              padding: "10px 16px", fontSize: 12, fontWeight: 600,
              fontFamily: font, cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: `0 2px 8px ${colors.primary}30`,
            }}
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* Budget list by establishment */}
      <div style={{ padding: "0 20px" }}>
        {Object.entries(grouped).map(([est, items]) => {
          const estTotal = items.reduce((s, b) => s + b.planned, 0);
          const estConsumed = items.reduce((s, b) => s + b.consumed, 0);
          const estPct = estTotal > 0 ? Math.round((estConsumed / estTotal) * 100) : 0;
          return (
            <div key={est} style={{ marginBottom: 20 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 8,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: colors.text,
                  textTransform: "uppercase", letterSpacing: 0.5,
                }}>
                  📍 {est}
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600,
                  color: barColor(estPct),
                }}>
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
                    style={{
                      background: colors.card, borderRadius: radius.lg, padding: 12,
                      border: `1px solid ${colors.borderLight}`,
                      marginBottom: 8, cursor: "pointer",
                      transition: "all 0.2s", boxShadow: shadows.xs,
                    }}
                  >
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                      marginBottom: 6,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                          {b.name}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textLight, marginTop: 1 }}>
                          {b.sector} · {b.period}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: barColor(pct) }}>
                          {pct}%
                        </div>
                        <div style={{ fontSize: 10, color: colors.textLight }}>
                          {formatGuaranies(remaining)} libre
                        </div>
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    <div style={{
                      background: colors.bg, borderRadius: radius.xs, height: 5,
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", width: `${Math.min(pct, 100)}%`,
                        background: barColor(pct), borderRadius: radius.xs,
                      }} />
                    </div>

                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 10, color: colors.textLight, marginTop: 4,
                    }}>
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
          <div style={{
            textAlign: "center", padding: 40, color: colors.textLight,
            fontSize: 13,
          }}>
            No hay presupuestos activos
            {filterEst !== "all" ? ` para ${filterEst}` : ""}
          </div>
        )}
      </div>

      {/* Reset button */}
      <div style={{ padding: "16px 20px" }}>
        <button
          onClick={() => setShowConfirmReset(true)}
          disabled={saving}
          style={{
            width: "100%", padding: "12px", borderRadius: radius.md,
            border: `1px solid ${colors.border}`, background: colors.surface,
            color: colors.textLight, fontSize: 12, fontWeight: 500,
            fontFamily: font, cursor: saving ? "default" : "pointer",
          }}
        >
          Refrescar presupuestos desde servidor
        </button>
      </div>

      {/* Confirm reset modal */}
      {showConfirmReset && (
        <ModalBackdrop onClose={() => setShowConfirmReset(false)} variant="center">
          <div style={{
            background: colors.card, borderRadius: radius.xl, padding: 24,
            maxWidth: 340, width: "100%",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 8 }}>
              Refrescar presupuestos
            </div>
            <div style={{ fontSize: 13, color: colors.textLight, marginBottom: 20, lineHeight: 1.5 }}>
              Se recargarán todos los presupuestos desde el servidor.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowConfirmReset(false)}
                style={{
                  flex: 1, padding: "12px", borderRadius: radius.md,
                  border: `1px solid ${colors.border}`, background: colors.card,
                  color: colors.text, fontSize: 13, fontWeight: 600,
                  fontFamily: font, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                style={{
                  flex: 1, padding: "12px", borderRadius: radius.md,
                  border: "none", background: colors.primary,
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  fontFamily: font, cursor: saving ? "default" : "pointer",
                }}
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
          <div style={{
            background: colors.card, borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
            padding: "20px 20px 40px", maxWidth: 480, width: "100%",
            maxHeight: "85vh", overflowY: "auto",
            animation: "fadeIn 0.3s ease",
          }}>
            <div style={{
              width: 40, height: 4, background: colors.border,
              borderRadius: 2, margin: "0 auto 16px",
            }} />

            <h3 style={{
              fontFamily: fontDisplay, fontSize: 20, fontWeight: 600,
              color: colors.text, margin: "0 0 16px",
            }}>
              {editingId ? "Editar Presupuesto" : "Nuevo Presupuesto"}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="Ej: Taller Ypoti"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Establecimiento</label>
                  <select
                    value={form.establishment}
                    onChange={e => update("establishment", e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Seleccionar...</option>
                    {establishments.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Sector</label>
                  <select
                    value={form.sector}
                    onChange={e => update("sector", e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Seleccionar...</option>
                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Período</label>
                  <input
                    value={form.period}
                    onChange={e => update("period", e.target.value)}
                    placeholder="2026"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Inicio</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => update("startDate", e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Fin</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => update("endDate", e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Monto Planificado (₲)</label>
                  <input
                    type="number"
                    value={form.planned || ""}
                    onChange={e => update("planned", parseInt(e.target.value) || 0)}
                    placeholder="100000000"
                    style={inputStyle}
                    min={0}
                  />
                  {form.planned > 0 && (
                    <div style={{ fontSize: 10, color: colors.textLight, marginTop: 2 }}>
                      {formatGuaranies(form.planned)}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Consumido (₲)</label>
                  <input
                    type="number"
                    value={form.consumed || ""}
                    onChange={e => update("consumed", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    style={inputStyle}
                    min={0}
                  />
                  {form.consumed > 0 && (
                    <div style={{ fontSize: 10, color: colors.textLight, marginTop: 2 }}>
                      {formatGuaranies(form.consumed)}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {editingId && (
                  <button
                    onClick={async () => {
                      await handleDeactivate(editingId);
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    disabled={saving}
                    style={{
                      padding: "12px 16px", borderRadius: radius.md,
                      border: `1px solid ${colors.danger}20`, background: colors.dangerLight,
                      color: colors.danger, fontSize: 12, fontWeight: 600,
                      fontFamily: font, cursor: saving ? "default" : "pointer",
                    }}
                  >
                    Desactivar
                  </button>
                )}
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  style={{
                    flex: 1, padding: "12px", borderRadius: radius.md,
                    border: `1px solid ${colors.border}`, background: colors.card,
                    color: colors.text, fontSize: 13, fontWeight: 600,
                    fontFamily: font, cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.name || !form.establishment || !form.planned || saving}
                  style={{
                    flex: 1, padding: "12px", borderRadius: radius.md, border: "none",
                    background: form.name && form.establishment && form.planned && !saving
                      ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                      : colors.border,
                    color: form.name && form.establishment && form.planned && !saving ? "#fff" : colors.textLight,
                    fontSize: 13, fontWeight: 600, fontFamily: font,
                    cursor: form.name && form.establishment && form.planned && !saving ? "pointer" : "default",
                    boxShadow: form.name && form.establishment && form.planned && !saving
                      ? `0 2px 8px ${colors.primary}30` : "none",
                  }}
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
