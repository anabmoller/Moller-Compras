import { useState, useEffect, useMemo } from "react";
import { colors, font, fontDisplay, labelStyle, inputStyle, shadows, radius } from "../../styles/theme";
import {
  PRIORITY_LEVELS, INVENTORY_ITEMS,
} from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { getEstablishments, getSectors, getProductTypes, getSuppliers } from "../../constants/parameters";
import { calculateApprovalSteps } from "../../constants/approvalConfig";
import { findBudgetForPR, wouldExceedBudget, formatGuaranies } from "../../constants/budgets";
import { getUsers } from "../../constants/users";
import SummaryRow from "../common/SummaryRow";
import InventoryModal from "./InventoryModal";

const UNITS = ["Unidad", "Litro", "Kg", "Dosis", "Bolsa", "Balde", "Caja", "Rollo", "Metro", "Otro"];

// Establishments that are NOT farms (no auto-assign)
const OFICINA_ESTABLISHMENTS = ["Oficina"];
const DEFAULT_FARM_ASSIGNEE = "Laura Rivas";

export default function NewRequestForm({ onSubmit, onCancel }) {
  const { currentUser } = useAuth();
  const { requests } = useApp();
  const [step, setStep] = useState(1);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [form, setForm] = useState({
    name: "",
    requester: currentUser?.name || "",
    establishment: currentUser?.establishment !== "General" ? currentUser?.establishment || "" : "",
    sector: "",
    type: "",
    urgency: "media",
    quantity: 1,
    unit: "Unidad",
    totalAmount: 0,
    reason: "",
    purpose: "",
    equipment: "",
    assignee: "",
    fromInventory: false,
    inventoryItem: null,
    suggestedSupplier: "",
    notes: "",
  });
  const [showInventory, setShowInventory] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (key, val) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      // Auto-assign Laura Rivas for farm establishments (anything except Oficina)
      if (key === "establishment" && val) {
        next.assignee = OFICINA_ESTABLISHMENTS.includes(val)
          ? ""
          : DEFAULT_FARM_ASSIGNEE;
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const selectInventoryItem = (item) => {
    setForm(prev => ({
      ...prev,
      name: item.name,
      type: item.type,
      fromInventory: true,
      inventoryItem: item,
    }));
    setErrors({});
    setShowInventory(false);
  };

  // Price history: find last purchase price for the selected product
  const priceHistory = useMemo(() => {
    if (!form.name || !requests?.length) return null;
    const needle = form.name.toLowerCase().trim();
    // Search through all past requests for items matching this product
    for (const req of requests) {
      if (!req.items?.length) continue;
      for (const item of req.items) {
        const itemName = (item.name || item.nombre || "").toLowerCase().trim();
        if (itemName === needle && (item.unitPrice || item.precioUnitario)) {
          return {
            unitPrice: item.unitPrice || item.precioUnitario,
            quantity: item.quantity || item.cantidad || 1,
            totalPrice: item.totalPrice || (item.unitPrice || item.precioUnitario) * (item.quantity || item.cantidad || 1),
            date: req.createdAt || req.date,
            establishment: req.establishment,
          };
        }
      }
    }
    return null;
  }, [form.name, requests]);

  // Calculate preview approval info
  const approvalPreview = useMemo(() => {
    if (!form.establishment || !form.totalAmount) return null;
    try {
      const users = getUsers();
      const steps = calculateApprovalSteps({
        establishment: form.establishment,
        totalAmount: form.totalAmount || 0,
        urgency: (form.urgency || "media").toLowerCase(),
        sector: form.sector || "",
        company: null,
        budgetExceeded: false,
      }, users);
      return steps;
    } catch { return null; }
  }, [form.establishment, form.totalAmount, form.urgency, form.sector]);

  // Budget check preview
  const budgetInfo = useMemo(() => {
    if (!form.establishment || !form.sector) return null;
    const budget = findBudgetForPR(form.establishment, form.sector);
    if (!budget) return null;
    const exceeds = form.totalAmount > 0 ? wouldExceedBudget(budget, form.totalAmount) : false;
    return { budget, exceeds };
  }, [form.establishment, form.sector, form.totalAmount]);

  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.name.trim()) e.name = "Requerido";
      if (!form.requester.trim()) e.requester = "Requerido";
      if (!form.establishment) e.establishment = "Requerido";
      if (!form.sector) e.sector = "Requerido";
    }
    if (step === 2) {
      if (!form.quantity || form.quantity <= 0) e.quantity = "Debe ser > 0";
      if (!form.reason.trim()) e.reason = "Requerido";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      if (step < 3) setStep(s => s + 1);
      else {
        // Auto-create item from the selected product so it appears in ITEMS section
        const formToSubmit = { ...form };
        if (form.name) {
          const unitPrice = form.totalAmount && form.quantity
            ? Math.round(form.totalAmount / form.quantity)
            : 0;
          formToSubmit.items = [{
            name: form.name,
            code: form.inventoryItem?.code || "",
            quantity: form.quantity || 1,
            unit: form.unit || "Unidad",
            unitPrice,
            totalPrice: form.totalAmount || 0,
            notes: "",
          }];
        }
        onSubmit(formToSubmit);
      }
    }
  };

  const stepTitles = [
    { title: "¿Qué necesitas?", sub: "Selecciona del catálogo o crea un producto nuevo" },
    { title: "Detalles", sub: "Cantidad, urgencia y justificación de la compra" },
    { title: "Revisión y Envío", sub: "Verifica los datos antes de crear la solicitud" },
  ];

  const FieldError = ({ field }) => errors[field]
    ? <div style={{ fontSize: 11, color: colors.danger, marginTop: 3, fontWeight: 500 }}>{errors[field]}</div>
    : null;

  return (
    <div style={{ padding: "0 0 40px", animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <button onClick={onCancel} style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: font, fontSize: 14, color: colors.accent, fontWeight: 500,
        }}>
          ← Cancelar
        </button>
        <span style={{ fontSize: 12, color: colors.textLight, fontWeight: 500 }}>
          Paso {step} de 3
        </span>
      </div>

      <div style={{ padding: "0 20px" }}>
        <h2 style={{
          fontFamily: fontDisplay, fontSize: 22, fontWeight: 600,
          color: colors.text, margin: "0 0 4px",
        }}>
          {stepTitles[step - 1].title}
        </h2>
        <div style={{ fontSize: 13, color: colors.textLight, marginBottom: 20 }}>
          {stepTitles[step - 1].sub}
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step
                ? s < step ? colors.success : colors.primary
                : colors.border,
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* ============ Step 1: Product Selection ============ */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Product Selector */}
            <div>
              <label style={labelStyle}>Producto *</label>
              <div
                onClick={() => setShowInventory(true)}
                style={{
                  ...inputStyle,
                  display: "flex", alignItems: "center", gap: 8,
                  cursor: "pointer",
                  background: form.fromInventory ? colors.success + "06" : colors.card,
                  borderColor: errors.name ? colors.danger : form.fromInventory ? colors.success + "40" : colors.border,
                }}
              >
                <span style={{ fontSize: 16 }}>📦</span>
                <span style={{
                  flex: 1,
                  color: form.name ? colors.text : colors.textLight,
                  fontSize: 14,
                }}>
                  {form.name || "Buscar en catalogo o crear nuevo..."}
                </span>
                {form.inventoryItem && (
                  <span style={{
                    fontSize: 10, background: colors.success + "15",
                    color: colors.success, padding: "2px 8px", borderRadius: radius.xs,
                    fontWeight: 600, fontFamily: "monospace",
                  }}>
                    {form.inventoryItem.code}
                  </span>
                )}
                {form.fromInventory && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      update("name", "");
                      update("type", "");
                      update("fromInventory", false);
                      update("inventoryItem", null);
                    }}
                    style={{
                      background: colors.border, border: "none", cursor: "pointer",
                      width: 22, height: 22, borderRadius: radius.sm, fontSize: 11,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <FieldError field="name" />
            </div>

            {showInventory && (
              <InventoryModal
                onSelect={selectInventoryItem}
                onClose={() => setShowInventory(false)}
                onNewProduct={() => {
                  setShowInventory(false);
                  update("fromInventory", false);
                  update("inventoryItem", null);
                }}
              />
            )}

            {!form.fromInventory && !form.inventoryItem && form.name === "" && (
              <div>
                <label style={labelStyle}>Nombre del producto (manual)</label>
                <input
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="Descripción del producto o servicio"
                  style={{ ...inputStyle, borderColor: errors.name ? colors.danger : colors.border }}
                />
                <FieldError field="name" />
              </div>
            )}

            {!form.fromInventory && form.name && (
              <div>
                <label style={labelStyle}>Nombre del producto</label>
                <input
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="Descripción del producto o servicio"
                  style={inputStyle}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Solicitante *</label>
                <input
                  value={form.requester}
                  readOnly
                  style={{
                    ...inputStyle,
                    background: colors.surface,
                    color: colors.textLight,
                    cursor: "default",
                    borderColor: errors.requester ? colors.danger : colors.border,
                  }}
                />
                <FieldError field="requester" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Establecimiento *</label>
                <select
                  value={form.establishment}
                  onChange={e => update("establishment", e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.establishment ? colors.danger : colors.border }}
                >
                  <option value="">Seleccionar...</option>
                  {getEstablishments().filter(e => e.active).map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                </select>
                <FieldError field="establishment" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Sector *</label>
                <select
                  value={form.sector}
                  onChange={e => update("sector", e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.sector ? colors.danger : colors.border }}
                >
                  <option value="">Seleccionar...</option>
                  {getSectors().filter(s => s.active).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
                <FieldError field="sector" />
              </div>
            </div>

            {!form.fromInventory && (
              <div>
                <label style={labelStyle}>Tipo de Producto</label>
                <select
                  value={form.type}
                  onChange={e => update("type", e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Seleccionar...</option>
                  {getProductTypes().filter(t => t.active).map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            )}

            {form.fromInventory && form.inventoryItem && (
              <div style={{
                background: colors.success + "06", borderRadius: radius.lg, padding: "10px 14px",
                border: `1px solid ${colors.success}20`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.success, marginBottom: 4 }}>
                  ✓ Producto del catalogo
                </div>
                <div style={{ fontSize: 12, color: colors.textLight }}>
                  {form.inventoryItem.code} · {form.inventoryItem.group} · {form.inventoryItem.type}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ Step 2: Details ============ */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Cantidad *</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={e => update("quantity", parseInt(e.target.value) || 0)}
                  style={{ ...inputStyle, borderColor: errors.quantity ? colors.danger : colors.border }}
                  min={1}
                />
                <FieldError field="quantity" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Unidad</label>
                <select
                  value={form.unit}
                  onChange={e => update("unit", e.target.value)}
                  style={inputStyle}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Monto Estimado (₲)</label>
              <input
                type="number"
                value={form.totalAmount || ""}
                onChange={e => update("totalAmount", parseInt(e.target.value) || 0)}
                placeholder="Ej: 5000000"
                style={inputStyle}
                min={0}
              />
              {form.totalAmount > 0 && (
                <div style={{ fontSize: 11, color: colors.primary, marginTop: 4, fontWeight: 500 }}>
                  {formatGuaranies(form.totalAmount)}
                </div>
              )}
              {/* Price history suggestion */}
              {priceHistory && !form.totalAmount && (
                <button
                  type="button"
                  onClick={() => update("totalAmount", Math.round(priceHistory.unitPrice * (form.quantity || 1)))}
                  style={{
                    marginTop: 6, padding: "6px 10px", borderRadius: radius.md,
                    background: colors.info + "10", border: `1px solid ${colors.info}25`,
                    cursor: "pointer", width: "100%", textAlign: "left",
                    fontFamily: font,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: colors.info }}>
                    💡 Precio historico disponible
                  </div>
                  <div style={{ fontSize: 10, color: colors.textLight, marginTop: 2 }}>
                    Ultima compra: {formatGuaranies(priceHistory.unitPrice)}/unidad
                    {priceHistory.date && ` — ${new Date(priceHistory.date).toLocaleDateString("es-PY")}`}
                  </div>
                  <div style={{ fontSize: 10, color: colors.info, marginTop: 2, fontWeight: 500 }}>
                    Clic para usar: {formatGuaranies(priceHistory.unitPrice * (form.quantity || 1))}
                  </div>
                </button>
              )}
            </div>

            {/* Budget indicator */}
            {budgetInfo && form.totalAmount > 0 && (
              <div style={{
                background: budgetInfo.exceeds ? colors.danger + "08" : colors.success + "06",
                borderRadius: radius.md, padding: "8px 12px",
                border: `1px solid ${budgetInfo.exceeds ? colors.danger : colors.success}20`,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 600,
                  color: budgetInfo.exceeds ? colors.danger : colors.success,
                }}>
                  {budgetInfo.exceeds ? "⚠ Excede presupuesto" : "✓ Dentro del presupuesto"}
                </div>
                <div style={{ fontSize: 10, color: colors.textLight, marginTop: 2 }}>
                  Presupuesto: {formatGuaranies(budgetInfo.budget.planned)} ({form.establishment} / {form.sector})
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Prioridad</label>
              <div style={{ display: "flex", gap: 8 }}>
                {PRIORITY_LEVELS.map(u => (
                  <button
                    key={u.value}
                    onClick={() => update("urgency", u.value)}
                    style={{
                      flex: 1, padding: "12px 6px", borderRadius: radius.md,
                      border: form.urgency === u.value
                        ? `2px solid ${u.color}`
                        : `1px solid ${colors.border}`,
                      background: form.urgency === u.value ? (u.colorLight || u.color + "10") : colors.card,
                      cursor: "pointer", textAlign: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 16 }}>{u.icon}</div>
                    <div style={{
                      fontSize: 11, fontWeight: 600, marginTop: 4,
                      color: form.urgency === u.value ? u.color : colors.textLight,
                    }}>
                      {u.label}
                    </div>
                    <div style={{
                      fontSize: 9, color: colors.textMuted, marginTop: 2,
                    }}>
                      {u.days ? `${u.days}d` : `${u.hours}h`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>¿Por que necesitas este producto? *</label>
              <textarea
                value={form.reason}
                onChange={e => update("reason", e.target.value)}
                placeholder="Justificacion de la compra..."
                rows={3}
                style={{
                  ...inputStyle, resize: "vertical",
                  borderColor: errors.reason ? colors.danger : colors.border,
                }}
              />
              <FieldError field="reason" />
            </div>

            <div>
              <label style={labelStyle}>¿Para que sera utilizado?</label>
              <textarea
                value={form.purpose}
                onChange={e => update("purpose", e.target.value)}
                placeholder="Descripción del uso previsto..."
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {(form.type === "Repuesto" || form.type === "Equipamento" || form.type === "Maquinario") && (
              <div>
                <label style={labelStyle}>Equipo/Maquinaria relacionada</label>
                <input
                  value={form.equipment}
                  onChange={e => update("equipment", e.target.value)}
                  placeholder="Ej: Valtra BH 194, John Deere cod 26"
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Proveedor Sugerido</label>
              {!isCustomSupplier ? (
                <select
                  value={form.suggestedSupplier}
                  onChange={e => {
                    if (e.target.value === "__custom__") {
                      setIsCustomSupplier(true);
                      update("suggestedSupplier", "");
                    } else {
                      update("suggestedSupplier", e.target.value);
                    }
                  }}
                  style={inputStyle}
                >
                  <option value="">Seleccionar proveedor (opcional)...</option>
                  {(() => {
                    const suppliers = getSuppliers();
                    const productType = (form.type || "").toLowerCase();
                    // Sort: suppliers whose category matches product type first
                    const sorted = [...suppliers].sort((a, b) => {
                      const aCat = (a.category || "").toLowerCase();
                      const bCat = (b.category || "").toLowerCase();
                      const aMatch = productType && aCat.includes(productType) ? 0 : 1;
                      const bMatch = productType && bCat.includes(productType) ? 0 : 1;
                      if (aMatch !== bMatch) return aMatch - bMatch;
                      return (a.name || "").localeCompare(b.name || "");
                    });
                    // Group with separator if there are matching suppliers
                    const matching = sorted.filter(s => productType && (s.category || "").toLowerCase().includes(productType));
                    const rest = sorted.filter(s => !productType || !(s.category || "").toLowerCase().includes(productType));
                    return (
                      <>
                        {matching.map(s => (
                          <option key={s.id} value={s.name}>{s.name} — {s.category}</option>
                        ))}
                        {matching.length > 0 && rest.length > 0 && (
                          <option disabled>── Otros proveedores ──</option>
                        )}
                        {rest.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </>
                    );
                  })()}
                  <option value="__custom__">✏ Otro (escribir manualmente)</option>
                </select>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={form.suggestedSupplier}
                    onChange={e => update("suggestedSupplier", e.target.value)}
                    placeholder="Nombre del proveedor..."
                    style={{ ...inputStyle, flex: 1 }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSupplier(false);
                      update("suggestedSupplier", "");
                    }}
                    style={{
                      background: colors.border, border: "none", cursor: "pointer",
                      borderRadius: radius.md, padding: "0 10px", fontSize: 11,
                      color: colors.textLight, fontFamily: font,
                    }}
                  >
                    ✕ Lista
                  </button>
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Notas adicionales</label>
              <textarea
                value={form.notes}
                onChange={e => update("notes", e.target.value)}
                placeholder="Observaciones, especificaciones tecnicas..."
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>
        )}

        {/* ============ Step 3: Review & Submit ============ */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Approval preview */}
            <div style={{
              background: colors.primary + "06", borderRadius: radius.lg, padding: "12px 14px",
              border: `1px solid ${colors.primary}15`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.primary, marginBottom: 6 }}>
                🔄 Flujo de Autorización y Aprobación
              </div>
              {approvalPreview && approvalPreview.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {approvalPreview.map((s, i) => (
                    <div key={i} style={{
                      fontSize: 11, color: colors.text,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: radius.full,
                        background: colors.primary + "15", color: colors.primary,
                        fontSize: 9, fontWeight: 700, display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontWeight: 500 }}>{s.label}:</span>
                      <span style={{ color: colors.textLight }}>{s.approverName || "Automatico"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: colors.textLight }}>
                  Los aprobadores se asignaran automaticamente segun establecimiento, monto y sector.
                </div>
              )}
            </div>

            {/* Summary */}
            <div style={{
              background: colors.surface, borderRadius: radius.xl, padding: 16,
              border: `1px solid ${colors.borderLight}`,
            }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: colors.textLight,
                marginBottom: 10, textTransform: "uppercase", letterSpacing: 1,
              }}>
                Resumen de la solicitud
              </div>
              <SummaryRow label="Producto" value={form.name} />
              {form.inventoryItem && <SummaryRow label="Código" value={form.inventoryItem.code} />}
              <SummaryRow label="Solicitante" value={form.requester} />
              <SummaryRow label="Establecimiento" value={form.establishment} />
              <SummaryRow label="Sector" value={form.sector} />
              <SummaryRow label="Tipo" value={form.type || "—"} />
              <SummaryRow label="Cantidad" value={`${form.quantity} ${form.unit}`} />
              <SummaryRow
                label="Monto Est."
                value={form.totalAmount > 0 ? formatGuaranies(form.totalAmount) : "—"}
              />
              <SummaryRow label="Urgencia" value={form.urgency} />
              <SummaryRow label="Motivo" value={form.reason} />
              {form.purpose && <SummaryRow label="Uso" value={form.purpose} />}
              {form.equipment && <SummaryRow label="Equipo" value={form.equipment} />}
              {form.suggestedSupplier && <SummaryRow label="Proveedor" value={form.suggestedSupplier} />}
            </div>

            {/* Budget warning */}
            {budgetInfo?.exceeds && (
              <div style={{
                background: colors.warning + "10", borderRadius: radius.md, padding: "10px 12px",
                border: `1px solid ${colors.warning}30`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.warning }}>
                  ⚠ Esta solicitud excede el presupuesto asignado
                </div>
                <div style={{ fontSize: 10, color: colors.textLight, marginTop: 2 }}>
                  Se requerira aprobacion adicional del Director
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, paddingBottom: 20 }}>
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: "14px", borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
                background: colors.card, color: colors.text,
                fontSize: 14, fontWeight: 600, fontFamily: font,
                cursor: "pointer",
              }}
            >
              ← Anterior
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              flex: step > 1 ? 1 : undefined, width: step === 1 ? "100%" : undefined,
              padding: "14px", borderRadius: radius.lg, border: "none",
              background: step === 3 ? colors.secondary : colors.primary,
              color: "#fff",
              fontSize: 14, fontWeight: 600, fontFamily: font,
              cursor: "pointer",
              boxShadow: shadows.md,
            }}
          >
            {step === 3 ? "Crear Solicitud ✓" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}
