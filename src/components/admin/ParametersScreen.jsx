import { useState, useCallback, useMemo } from "react";
import { colors, font, fontDisplay, inputStyle, labelStyle, shadows, radius } from "../../styles/theme";
import {
  getParameters, addParameterItem, updateParameterItem,
  toggleParameterItem, initParameters,
} from "../../constants/parameters";
import { getUsers } from "../../constants/users";

const TABS = [
  { key: "establishments", label: "Establecimientos", icon: "\u{1F4CD}" },
  { key: "sectors", label: "Sectores", icon: "\u{1F3F7}" },
  { key: "productTypes", label: "Tipos Producto", icon: "\u{1F4E6}" },
  { key: "suppliers", label: "Proveedores", icon: "\u{1F3EA}" },
  { key: "companies", label: "Empresas", icon: "\u{1F3E2}" },
];

export default function ParametersScreen({ onBack }) {
  const [tab, setTab] = useState("establishments");
  const [params, setParams] = useState(() => getParameters());
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  const refresh = useCallback(() => setParams({ ...getParameters() }), []);

  const items = params[tab] || [];
  const filtered = items.filter(i =>
    !search || (i.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = items.filter(i => i.active).length;

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editingItem) {
        await updateParameterItem(tab, editingItem.id, formData);
      } else {
        await addParameterItem(tab, formData);
      }
      refresh();
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error("[Parameters] Save failed:", err);
      setActionError("Error al guardar: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    setSaving(true);
    try {
      await toggleParameterItem(tab, id);
      refresh();
    } catch (err) {
      console.error("[Parameters] Toggle failed:", err);
      setActionError("Error al cambiar estado: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("\u00BFRefrescar todos los par\u00E1metros desde el servidor?")) {
      setSaving(true);
      try {
        await initParameters();
        refresh();
      } catch (err) {
        console.error("[Parameters] Refresh failed:", err);
        setActionError("Error al refrescar: " + (err.message || "Error desconocido"));
      } finally {
        setSaving(false);
      }
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
          \u2190 Volver
        </button>
        <button onClick={handleReset} disabled={saving} style={{
          background: "transparent", border: "none", cursor: saving ? "default" : "pointer",
          fontFamily: font, fontSize: 12, color: saving ? colors.textMuted : colors.warning, fontWeight: 500,
          opacity: saving ? 0.6 : 1,
        }}>
          {saving ? "Cargando..." : "Refrescar"}
        </button>
      </div>

      <div style={{ padding: "0 20px" }}>
        <h2 style={{
          fontFamily: fontDisplay, fontSize: 22, fontWeight: 600,
          color: colors.text, margin: "0 0 4px",
        }}>
          Parámetros del Sistema
        </h2>
        <div style={{ fontSize: 13, color: colors.textLight, marginBottom: 16 }}>
          Configurar establecimientos, sectores, productos y proveedores
        </div>
      </div>

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
            <span style={{ fontSize: 14, opacity: 0.4 }}>{"\u{1F50D}"}</span>
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
          <button onClick={() => { setEditingItem(null); setShowForm(true); }} disabled={saving} style={{
            padding: "8px 16px", borderRadius: radius.lg, border: "none",
            background: saving
              ? colors.border
              : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: font,
            cursor: saving ? "default" : "pointer", whiteSpace: "nowrap",
            opacity: saving ? 0.6 : 1,
          }}>
            + Nuevo
          </button>
        </div>

        {/* Count badge */}
        <div style={{
          fontSize: 11, color: colors.textLight, marginBottom: 10, fontWeight: 500,
        }}>
          {activeCount} activos de {items.length} total \u00B7 Mostrando {filtered.length}
        </div>

        {/* Form Modal */}
        {showForm && (
          <ParameterForm
            tab={tab}
            item={editingItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
            saving={saving}
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
                {tab === "establishments" && `${item.company || ""} \u00B7 Gte: ${item.manager || "\u2014"}${item.senacsa_code ? ` \u00B7 SENACSA: ${item.senacsa_code}` : ""} \u00B7 ${item.location || ""}`}
                {tab === "sectors" && (item.description || "")}
                {tab === "productTypes" && (item.description || "")}
                {tab === "suppliers" && `${item.category || ""} \u00B7 ${item.phone || ""}`}
                {tab === "companies" && `${item.type === "empresa" ? "Empresa" : "Persona F\u00EDsica"} \u00B7 Dir: ${item.director || "\u2014"}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => { setEditingItem(item); setShowForm(true); }} disabled={saving} style={{
                background: colors.primary + "10", border: "none", borderRadius: radius.md,
                padding: "6px 10px", cursor: saving ? "default" : "pointer", fontSize: 12, color: colors.primary,
                fontWeight: 500, fontFamily: font, opacity: saving ? 0.5 : 1,
              }}>
                Editar
              </button>
              <button onClick={() => handleToggle(item.id)} disabled={saving} style={{
                background: item.active ? colors.danger + "10" : colors.success + "10",
                border: "none", borderRadius: radius.md, padding: "6px 10px",
                cursor: saving ? "default" : "pointer", fontSize: 12, fontFamily: font, fontWeight: 500,
                color: item.active ? colors.danger : colors.success,
                opacity: saving ? 0.5 : 1,
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
function ParameterForm({ tab, item, onSave, onCancel, saving }) {
  // Build user options for role-based dropdowns
  const usersByRole = useMemo(() => {
    const users = getUsers().filter(u => u.active);
    return {
      gerente: users.filter(u => ["gerente", "admin"].includes(u.role))
        .map(u => ({ value: u.username, label: u.name })),
      diretoria: users.filter(u => ["diretoria", "admin"].includes(u.role))
        .map(u => ({ value: u.username, label: u.name })),
    };
  }, []);

  const FIELDS = {
    establishments: [
      { key: "name", label: "Nombre", required: true },
      { key: "code", label: "Código", required: true },
      { key: "senacsa_code", label: "Código SENACSA" },
      { key: "company", label: "Empresa" },
      { key: "manager", label: "Gerente Responsable", type: "user_select", roleFilter: "gerente" },
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
      { key: "director", label: "Director", type: "user_select", roleFilter: "diretoria" },
    ],
  };

  const fields = FIELDS[tab] || [];
  const [form, setForm] = useState(() => {
    if (item) return { ...item };
    const empty = {};
    fields.forEach(f => { empty[f.key] = ""; });
    return empty;
  });

  // Auto-generate establishment code from name (e.g. "Cerro Memby" → "CMB")
  // Takes first letter of each word, uppercase, max 4 chars
  const autoGenerateCode = useCallback((name) => {
    if (!name) return "";
    return name.trim().split(/\s+/).map(w => w[0] || "").join("").toUpperCase().slice(0, 4);
  }, []);

  // Track whether user has manually edited the code field
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(!!item);

  const canSubmit = !saving && fields.filter(f => f.required).every(f => form[f.key]?.trim());

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
                disabled={saving}
                style={{ ...inputStyle, padding: "10px 12px", fontSize: 13 }}
              >
                <option value="">Seleccionar...</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === "user_select" ? (
              <select
                value={form[f.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                disabled={saving}
                style={{ ...inputStyle, padding: "10px 12px", fontSize: 13 }}
              >
                <option value="">Seleccionar usuario...</option>
                {(usersByRole[f.roleFilter] || []).map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            ) : (
              <input
                value={form[f.key] || ""}
                onChange={e => {
                  const val = e.target.value;
                  if (tab === "establishments" && f.key === "name" && !codeManuallyEdited) {
                    // Auto-generate code from name
                    setForm(prev => ({ ...prev, name: val, code: autoGenerateCode(val) }));
                  } else if (tab === "establishments" && f.key === "code") {
                    setCodeManuallyEdited(true);
                    setForm(prev => ({ ...prev, code: val }));
                  } else {
                    setForm(prev => ({ ...prev, [f.key]: val }));
                  }
                }}
                placeholder={f.label}
                disabled={saving}
                style={{ ...inputStyle, padding: "10px 12px", fontSize: 13 }}
              />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={onCancel} disabled={saving} style={{
          flex: 1, padding: 12, borderRadius: radius.lg,
          border: `1px solid ${colors.border}`, background: colors.card,
          color: colors.text, fontSize: 13, fontWeight: 600, fontFamily: font,
          cursor: saving ? "default" : "pointer",
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
          {saving ? "Guardando..." : (item ? "Guardar Cambios" : "Crear")}
        </button>
      </div>
    </div>
  );
}
