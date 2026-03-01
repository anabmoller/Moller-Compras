import { useState, useCallback, useMemo } from "react";
import { colors, font, fontDisplay, inputStyle, labelStyle, shadows, radius } from "../../styles/theme";
import {
  getParameters, addParameterItem, updateParameterItem,
  toggleParameterItem, initParameters, getCompanies,
} from "../../constants/parameters";
import { getUsers } from "../../constants/users";

const TABS = [
  { key: "establishments", label: "Establecimientos", icon: "\u{1F4CD}" },
  { key: "sectors", label: "Sectores", icon: "\u{1F3F7}" },
  { key: "productTypes", label: "Tipos Producto", icon: "\u{1F4E6}" },
  { key: "suppliers", label: "Proveedores", icon: "\u{1F3EA}" },
  { key: "companies", label: "Empresas", icon: "\u{1F3E2}" },
];

// ============================================================
// SENACSA + SMGeo reference data (real, from screenshots)
// Used to auto-fill when creating/editing establishments
// ============================================================
const SENACSA_DATA = {
  "SANTA MARIA":      { code: "0101190045", unidadZonal: "CONCEPCION", departamento: "Concepción", municipio: "" },
  "CIELO AZUL":       { code: "0101230338", unidadZonal: "CONCEPCION", departamento: "Concepción", municipio: "Paso Barreto", lat: "", lng: "" },
  "YPOTI":            { code: "0103780002", unidadZonal: "HORQUETA",   departamento: "Concepción", municipio: "Horqueta", lat: "-23.315485", lng: "-56.712392" },
  "YPOTI2":           { code: "0103780080", unidadZonal: "HORQUETA",   departamento: "Concepción", municipio: "Horqueta" },
  "ESTANCIA YPOTI":   { code: "0103780002", unidadZonal: "HORQUETA",   departamento: "Concepción", municipio: "Horqueta", lat: "-23.3157237", lng: "-56.7113371" },
  "CERRO MEMBY":      { code: "0107310001", unidadZonal: "YBY YAU",    departamento: "Concepción", municipio: "Yby Yaú", lat: "-22.951316", lng: "-56.457662" },
  "ESTANCIA CERRO MEMBY": { code: "0107310001", unidadZonal: "YBY YAU", departamento: "Concepción", municipio: "Yby Yaú", lat: "-22.951316", lng: "-56.457662" },
  "YBY PORA":         { code: "0107240013", unidadZonal: "YBY YAU",    departamento: "Concepción", municipio: "Yby Yaú" },
  "YBYPORA":          { code: "0107240013", unidadZonal: "YBY YAU",    departamento: "Concepción", municipio: "Yby Yaú" },
  "SANTA CLARA":      { code: "0210150007", unidadZonal: "SANTA ROSA DEL AGUARAY", departamento: "San Pedro", municipio: "Tacuatí", lat: "-23.474297", lng: "-56.236926" },
  "EST. SANTA CLARA": { code: "0210150007", unidadZonal: "SANTA ROSA DEL AGUARAY", departamento: "San Pedro", municipio: "Tacuatí", lat: "-23.474297", lng: "-56.236926" },
  "LUSIPAR":          { code: "0210150003", unidadZonal: "SANTA ROSA DEL AGUARAY", departamento: "San Pedro", municipio: "Tacuatí", lat: "-23.4333312", lng: "-56.3069802" },
  "ESTANCIA LUSIPAR": { code: "0210150003", unidadZonal: "SANTA ROSA DEL AGUARAY", departamento: "San Pedro", municipio: "Tacuatí", lat: "-23.4333312", lng: "-56.3069802" },
};

// Lookup by name (case-insensitive, partial match)
function lookupSenacsa(name) {
  if (!name) return null;
  const upper = name.toUpperCase().trim();
  if (SENACSA_DATA[upper]) return SENACSA_DATA[upper];
  for (const [key, data] of Object.entries(SENACSA_DATA)) {
    if (upper.includes(key) || key.includes(upper)) return data;
  }
  return null;
}

// ---- Helper: format "pedro.moller" → "Pedro Moller" ----
function formatName(raw) {
  if (!raw) return "—";
  const username = raw.includes("@") ? raw.split("@")[0] : raw;
  const parts = username.split(/[.\s_-]+/);
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

// ---- Helper: auto-generate establishment code ----
function autoGenerateCode(name) {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words.map(w => (w[0] || "")).join("").toUpperCase().slice(0, 4);
}

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
  const activeCount = items.filter(i => i.active !== false).length;

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

  // ---- Render subtitle for each item type ----
  const renderSubtitle = (item) => {
    switch (tab) {
      case "establishments": {
        const mgrName = formatName(item.manager);
        const parts = [item.company, `Gte: ${mgrName}`];
        if (item.senacsa_code) parts.push(`SENACSA: ${item.senacsa_code}`);
        if (item.senacsa_unidad_zonal) parts.push(item.senacsa_unidad_zonal);
        else if (item.location) parts.push(item.location);
        return parts.filter(Boolean).join(" · ");
      }
      case "sectors":
        return item.description || "";
      case "productTypes":
        return item.description || "";
      case "suppliers":
        return [item.category, item.phone].filter(Boolean).join(" · ");
      case "companies":
        return `${item.type === "empresa" ? "Empresa" : "Persona Física"} · Dir: ${formatName(item.director)}`;
      default:
        return "";
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
          {activeCount} activos de {items.length} total · Mostrando {filtered.length}
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
            opacity: (item.active !== false) ? 1 : 0.5,
            display: "flex", alignItems: "center", gap: 12, boxShadow: shadows.xs,
          }}>
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
                {renderSubtitle(item)}
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
                background: (item.active !== false) ? colors.danger + "10" : colors.success + "10",
                border: "none", borderRadius: radius.md, padding: "6px 10px",
                cursor: saving ? "default" : "pointer", fontSize: 12, fontFamily: font, fontWeight: 500,
                color: (item.active !== false) ? colors.danger : colors.success,
                opacity: saving ? 0.5 : 1,
              }}>
                {(item.active !== false) ? "Desact." : "Activar"}
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

// ==============================================================
// Dynamic Form — with SENACSA auto-fill + all fixes
// ==============================================================
function ParameterForm({ tab, item, onSave, onCancel, saving }) {
  const usersByRole = useMemo(() => {
    const users = getUsers().filter(u => u.active);
    return {
      gerente: users.filter(u => ["gerente", "admin"].includes(u.role))
        .map(u => ({ value: u.username, label: u.name })),
      diretoria: users.filter(u => ["diretoria", "admin"].includes(u.role))
        .map(u => ({ value: u.username, label: u.name })),
    };
  }, []);

  // FIX #1: Companies list for dropdown
  const companyOptions = useMemo(() => {
    try {
      const companies = getCompanies();
      if (companies && companies.length > 0) return companies.map(c => c.name).filter(Boolean);
    } catch { /* fallback */ }
    return [
      "Rural Bioenergia S.A.",
      "Chacobras S.A.",
      "La Constancia S.A.",
      "Control Pasto S.A.",
      "Ana Moller",
      "Gabriel Moller",
      "Pedro Moller",
    ];
  }, []);

  const FIELDS = {
    establishments: [
      { key: "name", label: "Nombre del Establecimiento", required: true },
      { key: "code", label: "Código (auto)", required: true, hint: "Se genera automáticamente del nombre" },
      { key: "senacsa_code", label: "Código SENACSA", hint: "Se auto-completa al escribir el nombre" },
      { key: "senacsa_unidad_zonal", label: "Unidad Zonal SENACSA" },
      { key: "company", label: "Empresa", type: "select", options: "companies", required: true },
      { key: "manager", label: "Gerente Responsable", type: "user_select", roleFilter: "gerente" },
      { key: "departamento", label: "Departamento" },
      { key: "municipio", label: "Municipio" },
      { key: "location", label: "Ubicación (texto libre)" },
      { key: "latitude", label: "Latitud", hint: "Ej: -23.3154" },
      { key: "longitude", label: "Longitud", hint: "Ej: -56.7123" },
    ],
    sectors: [
      { key: "name", label: "Nombre", required: true },
      { key: "description", label: "Descripción" },
    ],
    productTypes: [
      { key: "name", label: "Nombre", required: true },
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

  const [codeManuallyEdited, setCodeManuallyEdited] = useState(!!item);
  const [senacsaAutoFilled, setSenacsaAutoFilled] = useState(false);

  const canSubmit = !saving && fields.filter(f => f.required).every(f => (form[f.key] || "").toString().trim());

  const resolveOptions = (f) => {
    if (f.options === "companies") return companyOptions;
    if (Array.isArray(f.options)) return f.options;
    return [];
  };

  // Auto-fill SENACSA data when name changes
  const handleNameChange = useCallback((val) => {
    const updates = { name: val };

    if (!codeManuallyEdited) {
      updates.code = autoGenerateCode(val);
    }

    if (tab === "establishments") {
      const senacsa = lookupSenacsa(val);
      if (senacsa) {
        updates.senacsa_code = senacsa.code || "";
        updates.senacsa_unidad_zonal = senacsa.unidadZonal || "";
        if (senacsa.departamento) updates.departamento = senacsa.departamento;
        if (senacsa.municipio) updates.municipio = senacsa.municipio;
        if (senacsa.lat) updates.latitude = senacsa.lat;
        if (senacsa.lng) updates.longitude = senacsa.lng;
        if (senacsa.departamento && !updates.location) {
          updates.location = senacsa.departamento;
        }
        setSenacsaAutoFilled(true);
      }
    }

    setForm(prev => ({ ...prev, ...updates }));
  }, [codeManuallyEdited, tab]);

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

      {/* SENACSA auto-fill indicator */}
      {senacsaAutoFilled && tab === "establishments" && (
        <div style={{
          padding: "8px 12px", borderRadius: radius.md, marginBottom: 12,
          background: colors.success + "10", border: `1px solid ${colors.success}30`,
          fontSize: 11, color: colors.success, fontWeight: 500,
        }}>
          ✓ Datos SENACSA auto-completados desde la base de referencia
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={{ ...labelStyle, fontSize: 11 }}>
              {f.label} {f.required && <span style={{ color: colors.danger }}>*</span>}
            </label>
            {f.hint && (
              <div style={{ fontSize: 10, color: colors.textMuted || colors.textLight, marginBottom: 2, fontStyle: "italic" }}>
                {f.hint}
              </div>
            )}
            {f.type === "select" ? (
              <select
                value={form[f.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                disabled={saving}
                style={{ ...inputStyle, padding: "10px 12px", fontSize: 13 }}
              >
                <option value="">Seleccionar...</option>
                {resolveOptions(f).map(o => (
                  <option key={o} value={o}>
                    {o === "empresa" ? "Empresa" : o === "persona_fisica" ? "Persona Física" : o}
                  </option>
                ))}
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
                  if (tab === "establishments" && f.key === "name") {
                    handleNameChange(val);
                  } else if (tab === "establishments" && f.key === "code") {
                    setCodeManuallyEdited(true);
                    setForm(prev => ({ ...prev, code: val }));
                  } else {
                    setForm(prev => ({ ...prev, [f.key]: val }));
                  }
                }}
                placeholder={f.label}
                disabled={saving}
                style={{
                  ...inputStyle, padding: "10px 12px", fontSize: 13,
                  ...(senacsaAutoFilled && ["senacsa_code", "senacsa_unidad_zonal", "latitude", "longitude", "departamento", "municipio"].includes(f.key) && form[f.key]
                    ? { background: colors.success + "08", borderColor: colors.success + "40" }
                    : {}
                  ),
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Map preview if coordinates exist */}
      {tab === "establishments" && form.latitude && form.longitude && (
        <div style={{ marginTop: 12 }}>
          <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4, display: "block" }}>
            📍 Vista previa ubicación
          </label>
          <div style={{
            borderRadius: radius.lg, overflow: "hidden", border: `1px solid ${colors.border}`,
            height: 180,
          }}>
            <iframe
              title="Ubicación del establecimiento"
              width="100%"
              height="180"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.longitude) - 0.03}%2C${Number(form.latitude) - 0.02}%2C${Number(form.longitude) + 0.03}%2C${Number(form.latitude) + 0.02}&layer=mapnik&marker=${form.latitude}%2C${form.longitude}`}
              loading="lazy"
            />
          </div>
          <div style={{ fontSize: 10, color: colors.textLight, marginTop: 4, textAlign: "center" }}>
            Lat: {form.latitude} · Lng: {form.longitude}
          </div>
        </div>
      )}

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
