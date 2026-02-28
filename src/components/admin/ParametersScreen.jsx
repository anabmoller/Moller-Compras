import { useState, useCallback } from "react";
import { colors, font, fontDisplay, inputStyle, labelStyle, shadows, radius } from "../../styles/theme";
import {
  getParameters, addParameterItem, updateParameterItem,
  toggleParameterItem, resetParametersToDefault,
} from "../../constants/parameters";

const TABS = [
  { key: "establishments", label: "Establecimientos", icon: "📍" },
  { key: "sectors", label: "Sectores", icon: "🏷" },
  { key: "productTypes", label: "Tipos Producto", icon: "📦" },
  { key: "suppliers", label: "Proveedores", icon: "🏪" },
  { key: "companies", label: "Empresas", icon: "🏢" },
];

export default function ParametersScreen({ onBack }) {
  const [tab, setTab] = useState("establishments");
  const [params, setParams] = useState(() => getParameters());
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const refresh = useCallback(() => setParams({ ...getParameters() }), []);

  const items = params[tab] || [];
  const filtered = items.filter(i =>
    !search || (i.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = items.filter(i => i.active).length;

  const handleSave = (formData) => {
    if (editingItem) {
      updateParameterItem(tab, editingItem.id, formData);
    } else {
      addParameterItem(tab, formData);
    }
    refresh();
    setShowForm(false);
    setEditingItem(null);
  };

  const handleToggle = (id) => {
    toggleParameterItem(tab, id);
    refresh();
  };

  const handleReset = () => {
    if (window.confirm("¿Resetear todos los parámetros a valores por defecto?")) {
      resetParametersToDefault();
      refresh();
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: font, fontSize: 14, color: colors.primary, fontWeight: 500,
        }}>
          ← Volver
        </button>
        <button onClick={handleReset} style={{
          background: "transparent", border: "none", cursor: "pointer",
          fontFamily: font, fontSize: 12, color: colors.warning, fontWeight: 500,
        }}>
          Resetear
        </button>
      </div>

      <div style={{ padding: "0 20px" }}>
        <h2 style={{
          fontFamily: fontDisplay, fontSize: 22, fontWeight: 600,
          color: colors.text, margin: "0 0 4px",
        }}>
          Parametros del Sistema
        </h2>
        <div style={{ fontSize: 13, color: colors.textLight, marginBottom: 16 }}>
          Configurar establecimientos, sectores, productos y proveedores
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: "flex", gap: 4, padding: "0 20px 12px",
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); setShowForm(false); setEditingItem(null); }} style={{
            padding: "8px 14px", borderRadius: radius.lg, border: "none",
            background: tab === t.key ? colors.primary : colors.card,
            color: tab === t.key ? "#fff" : colors.textLight,
            fontSize: 12, fontWeight: 600, fontFamily: font,
            cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: tab === t.key ? `0 2px 8px ${colors.primary}30` : `0 1px 3px rgba(0,0,0,0.06)`,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 20px 120px" }}>
        {/* Search + Add */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            background: colors.card, border: `1px solid ${colors.border}`,
            borderRadius: radius.lg, padding: "8px 12px",
          }}>
            <span style={{ fontSize: 14, opacity: 0.4 }}>🔍</span>
            <input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: "none", background: "transparent", outline: "none",
                fontFamily: font, fontSize: 13, color: colors.text, width: "100%",
              }}
            />
          </div>
          <button onClick={() => { setEditingItem(null); setShowForm(true); }} style={{
            padding: "8px 16px", borderRadius: radius.lg, border: "none",
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: font,
            cursor: "pointer", whiteSpace: "nowrap",
          }}>
            + Nuevo
          </button>
        </div>

        {/* Count badge */}
        <div style={{
          fontSize: 11, color: colors.textLight, marginBottom: 10, fontWeight: 500,
        }}>
          {activeCount} activos de {items.length} total · Mostrando {filtered.length}
        </div>

        {/* Form Modal */}
        {showForm && (
          <ParameterForm
            tab={tab}
            item={editingItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        )}

        {/* Items List */}
        {filtered.map(item => (
          <div key={item.id} style={{
            background: colors.card, borderRadius: radius.lg, padding: "14px 16px",
            marginBottom: 8, border: `1px solid ${colors.borderLight}`,
            opacity: item.active ? 1 : 0.5,
            display: "flex", alignItems: "center", gap: 12, boxShadow: shadows.xs,
          }}>
            {item.icon && <span style={{ fontSize: 20 }}>{item.icon}</span>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
                {item.name}
                {item.code && (
                  <span style={{
                    fontSize: 10, color: colors.textLight, marginLeft: 8,
                    background: colors.surface, padding: "2px 6px", borderRadius: radius.xs,
                  }}>
                    {item.code}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
                {tab === "establishments" && `${item.company || ""} · Gte: ${item.manager || "—"} · ${item.location || ""}`}
                {tab === "sectors" && (item.description || "")}
                {tab === "productTypes" && (item.description || "")}
                {tab === "suppliers" && `${item.category || ""} · ${item.phone || ""}`}
                {tab === "companies" && `${item.type === "empresa" ? "Empresa" : "Persona Física"} · Dir: ${item.director || "—"}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => { setEditingItem(item); setShowForm(true); }} style={{
                background: colors.primary + "10", border: "none", borderRadius: radius.md,
                padding: "6px 10px", cursor: "pointer", fontSize: 12, color: colors.primary,
                fontWeight: 500, fontFamily: font,
              }}>
                Editar
              </button>
              <button onClick={() => handleToggle(item.id)} style={{
                background: item.active ? colors.danger + "10" : colors.success + "10",
                border: "none", borderRadius: radius.md, padding: "6px 10px",
                cursor: "pointer", fontSize: 12, fontFamily: font, fontWeight: 500,
                color: item.active ? colors.danger : colors.success,
              }}>
                {item.active ? "Desact." : "Activar"}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: colors.textLight, fontSize: 13 }}>
            No se encontraron registros
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Dynamic Form based on tab ----
function ParameterForm({ tab, item, onSave, onCancel }) {
  const FIELDS = {
    establishments: [
      { key: "name", label: "Nombre", required: true },
      { key: "code", label: "Código", required: true },
      { key: "company", label: "Empresa" },
      { key: "manager", label: "Gerente Responsable" },
      { key: "location", label: "Ubicación" },
    ],
    sectors: [
      { key: "name", label: "Nombre", required: true },
      { key: "icon", label: "Ícono (emoji)" },
      { key: "description", label: "Descripción" },
    ],
    productTypes: [
      { key: "name", label: "Nombre", required: true },
      { key: "icon", label: "Ícono (emoji)" },
      { key: "description", label: "Descripción" },
    ],
    suppliers: [
      { key: "name", label: "Nombre / Razón Social", required: true },
      { key: "ruc", label: "RUC" },
      { key: "phone", label: "Teléfono" },
      { key: "email", label: "Email" },
      { key: "category", label: "Categoría" },
    ],
    companies: [
      { key: "name", label: "Nombre", required: true },
      { key: "ruc", label: "RUC" },
      { key: "type", label: "Tipo", type: "select", options: ["empresa", "persona_fisica"] },
      { key: "director", label: "Director" },
    ],
  };

  const fields = FIELDS[tab] || [];
  const [form, setForm] = useState(() => {
    if (item) return { ...item };
    const empty = {};
    fields.forEach(f => { empty[f.key] = ""; });
    return empty;
  });

  const canSubmit = fields.filter(f => f.required).every(f => form[f.key]?.trim());

  return (
    <div style={{
      background: colors.surface, borderRadius: radius.xl, padding: 20,
      border: `1px solid ${colors.primary}30`, marginBottom: 16,
    }}>
      <div style={{
        fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 16,
      }}>
        {item ? `Editar: ${item.name}` : "Nuevo Registro"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={{ ...labelStyle, fontSize: 11 }}>
              {f.label} {f.required && <span style={{ color: colors.danger }}>*</span>}
            </label>
            {f.type === "select" ? (
              <select
                value={form[f.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                style={{ ...inputStyle, padding: "10px 12px", fontSize: 13 }}
              >
                <option value="">Seleccionar...</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                value={form[f.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.label}
                style={{ ...inputStyle, padding: "10px 12px", fontSize: 13 }}
              />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: 12, borderRadius: radius.lg,
          border: `1px solid ${colors.border}`, background: colors.card,
          color: colors.text, fontSize: 13, fontWeight: 600, fontFamily: font,
          cursor: "pointer",
        }}>
          Cancelar
        </button>
        <button
          onClick={() => canSubmit && onSave(form)}
          disabled={!canSubmit}
          style={{
            flex: 1, padding: 12, borderRadius: radius.lg, border: "none",
            background: canSubmit
              ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
              : colors.border,
            color: canSubmit ? "#fff" : colors.textLight,
            fontSize: 13, fontWeight: 600, fontFamily: font,
            cursor: canSubmit ? "pointer" : "default",
          }}
        >
          {item ? "Guardar Cambios" : "Crear"}
        </button>
      </div>
    </div>
  );
}
