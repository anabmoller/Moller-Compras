import { useState } from "react";
import { colors, font, fontDisplay, inputStyle, labelStyle, shadows, radius } from "../../styles/theme";
import { generateQuotationId } from "../../utils/ids";

export default function QuotationPanel({ request, onClose, onSave }) {
  const [quotations, setQuotations] = useState(request.quotations || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    supplier: "",
    price: "",
    currency: "PYG",
    deliveryDays: "",
    notes: "",
    paymentTerms: "",
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const addQuotation = () => {
    if (!form.supplier.trim() || !form.price) return;
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) return;
    const deliveryDays = Math.max(0, Math.min(9999, parseInt(form.deliveryDays) || 0));
    const newQ = {
      id: generateQuotationId(),
      supplier: form.supplier.trim().slice(0, 200),
      currency: form.currency,
      price,
      deliveryDays,
      paymentTerms: (form.paymentTerms || "").trim().slice(0, 500),
      notes: (form.notes || "").trim().slice(0, 1000),
      date: new Date().toISOString().slice(0, 10),
      selected: false,
    };
    const updated = [...quotations, newQ];
    setQuotations(updated);
    setForm({ supplier: "", price: "", currency: "PYG", deliveryDays: "", notes: "", paymentTerms: "" });
    setShowAddForm(false);
  };

  const selectQuotation = (qId) => {
    const updated = quotations.map(q => ({ ...q, selected: q.id === qId }));
    setQuotations(updated);
  };

  const handleSave = () => {
    onSave(request.id, { quotations });
    onClose();
  };

  const cheapest = quotations.length > 0
    ? quotations.reduce((min, q) => q.price < min.price ? q : min, quotations[0])
    : null;

  const fastest = quotations.length > 0
    ? quotations.filter(q => q.deliveryDays > 0)
        .reduce((min, q) => q.deliveryDays < min.deliveryDays ? q : min, quotations.filter(q => q.deliveryDays > 0)[0] || quotations[0])
    : null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        background: colors.bg, borderRadius: "20px 20px 0 0",
        maxWidth: 480, width: "100%", maxHeight: "90vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 12px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 8,
          }}>
            <h3 style={{
              fontFamily: fontDisplay, fontSize: 20, fontWeight: 600,
              color: colors.text, margin: 0,
            }}>
              Cotizaciones
            </h3>
            <button onClick={onClose} style={{
              background: colors.border, border: "none", width: 32, height: 32,
              borderRadius: radius.md, cursor: "pointer", fontSize: 16,
            }}>
              ✕
            </button>
          </div>
          <div style={{ fontSize: 12, color: colors.textLight }}>
            {request.name} · {request.id}
          </div>
        </div>

        <div style={{ overflow: "auto", padding: "0 20px 20px", flex: 1 }}>
          {/* Summary badges */}
          {quotations.length > 0 && (
            <div style={{
              display: "flex", gap: 8, marginBottom: 14,
            }}>
              <div style={{
                flex: 1, background: colors.success + "10", borderRadius: radius.lg,
                padding: "10px 12px", border: `1px solid ${colors.success}20`,
              }}>
                <div style={{ fontSize: 10, color: colors.success, fontWeight: 600, textTransform: "uppercase" }}>
                  Mas barato
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.success, marginTop: 2 }}>
                  {cheapest?.currency} {cheapest?.price?.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: colors.textLight, marginTop: 1 }}>
                  {cheapest?.supplier}
                </div>
              </div>
              {fastest && fastest.deliveryDays > 0 && (
                <div style={{
                  flex: 1, background: colors.primary + "10", borderRadius: radius.lg,
                  padding: "10px 12px", border: `1px solid ${colors.primary}20`,
                }}>
                  <div style={{ fontSize: 10, color: colors.primary, fontWeight: 600, textTransform: "uppercase" }}>
                    Mas rapido
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.primary, marginTop: 2 }}>
                    {fastest.deliveryDays} dias
                  </div>
                  <div style={{ fontSize: 10, color: colors.textLight, marginTop: 1 }}>
                    {fastest.supplier}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quotation list */}
          {quotations.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "24px 0",
              color: colors.textLight, fontSize: 13,
            }}>
              No hay cotizaciones registradas
            </div>
          ) : (
            quotations.map((q, idx) => (
              <div
                key={q.id}
                onClick={() => selectQuotation(q.id)}
                style={{
                  background: q.selected ? colors.success + "08" : colors.card,
                  borderRadius: radius.lg, padding: "14px 16px",
                  marginBottom: 8, cursor: "pointer",
                  border: q.selected
                    ? `2px solid ${colors.success}`
                    : `1px solid ${colors.borderLight}`,
                  position: "relative",
                }}
              >
                {q.selected && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    background: colors.success, color: "#fff",
                    width: 22, height: 22, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                  }}>
                    ✓
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
                      {q.supplier}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
                      {q.date}
                      {q.deliveryDays > 0 && ` · ${q.deliveryDays} dias entrega`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: 16, fontWeight: 700,
                      color: q.id === cheapest?.id ? colors.success : colors.text,
                    }}>
                      {q.currency} {q.price.toLocaleString()}
                    </div>
                  </div>
                </div>
                {q.paymentTerms && (
                  <div style={{
                    fontSize: 11, color: colors.textLight, marginTop: 6,
                    background: colors.surface, padding: "4px 8px", borderRadius: radius.sm,
                    display: "inline-block",
                  }}>
                    {q.paymentTerms}
                  </div>
                )}
                {q.notes && (
                  <div style={{
                    fontSize: 11, color: colors.textLight, marginTop: 4,
                    fontStyle: "italic",
                  }}>
                    {q.notes}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add form */}
          {showAddForm ? (
            <div style={{
              background: colors.card, borderRadius: radius.xl, padding: 16,
              border: `1px solid ${colors.borderLight}`, marginTop: 8,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 12,
              }}>
                Nueva Cotizacion
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Proveedor</label>
                  <input
                    value={form.supplier}
                    onChange={e => update("supplier", e.target.value)}
                    placeholder="Nombre del proveedor"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Precio</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => update("price", e.target.value)}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ width: 100 }}>
                    <label style={labelStyle}>Moneda</label>
                    <select
                      value={form.currency}
                      onChange={e => update("currency", e.target.value)}
                      style={inputStyle}
                    >
                      <option value="PYG">PYG</option>
                      <option value="USD">USD</option>
                      <option value="BRL">BRL</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Plazo de entrega (dias)</label>
                  <input
                    type="number"
                    value={form.deliveryDays}
                    onChange={e => update("deliveryDays", e.target.value)}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Condiciones de pago</label>
                  <input
                    value={form.paymentTerms}
                    onChange={e => update("paymentTerms", e.target.value)}
                    placeholder="Ej: 30 dias, contado, cheque"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Observaciones</label>
                  <textarea
                    value={form.notes}
                    onChange={e => update("notes", e.target.value)}
                    placeholder="Notas adicionales..."
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowAddForm(false)}
                    style={{
                      flex: 1, padding: "12px", borderRadius: radius.lg,
                      border: `1px solid ${colors.border}`,
                      background: colors.card, color: colors.text,
                      fontSize: 13, fontWeight: 600, fontFamily: font,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addQuotation}
                    disabled={!form.supplier || !form.price}
                    style={{
                      flex: 1, padding: "12px", borderRadius: radius.lg,
                      border: "none",
                      background: form.supplier && form.price
                        ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                        : colors.border,
                      color: form.supplier && form.price ? "#fff" : colors.textLight,
                      fontSize: 13, fontWeight: 600, fontFamily: font,
                      cursor: form.supplier && form.price ? "pointer" : "default",
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: "100%", padding: "14px", borderRadius: radius.lg,
                border: `1px dashed ${colors.primary}40`,
                background: colors.primary + "06",
                color: colors.primary,
                fontSize: 13, fontWeight: 600, fontFamily: font,
                cursor: "pointer", marginTop: 8,
              }}
            >
              + Agregar Cotizacion
            </button>
          )}

          {/* Save button */}
          {quotations.length > 0 && (
            <button
              onClick={handleSave}
              style={{
                width: "100%", padding: "14px", borderRadius: radius.lg,
                border: "none",
                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
                color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: font,
                cursor: "pointer", marginTop: 12,
                boxShadow: `0 4px 16px ${colors.accent}30`,
              }}
            >
              Guardar Cotizaciones ({quotations.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
