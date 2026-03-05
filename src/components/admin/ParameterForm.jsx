import { useState, useMemo, useCallback } from "react";
import { getUsers } from "../../constants/users";
import { getCompanies } from "../../constants/parameters";

// ============================================================
// SENACSA + SMGeo reference data (real, from screenshots)
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

function lookupSenacsa(name) {
  if (!name) return null;
  const upper = name.toUpperCase().trim();
  if (SENACSA_DATA[upper]) return SENACSA_DATA[upper];
  for (const [key, data] of Object.entries(SENACSA_DATA)) {
    if (upper.includes(key) || key.includes(upper)) return data;
  }
  return null;
}

function autoGenerateCode(name) {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words.map(w => (w[0] || "")).join("").toUpperCase().slice(0, 4);
}

const FIELDS = {
  establishments: [
    { key: "name", label: "Nombre del Establecimiento", required: true },
    { key: "code", label: "C\u00f3digo (auto)", required: true, hint: "Se genera autom\u00e1ticamente del nombre" },
    { key: "tipo_entidad", label: "Tipo de Entidad", type: "select", options: [
      { value: "establecimiento", label: "Establecimiento" },
      { value: "proveedor_ganado", label: "Proveedor Ganado" },
      { value: "proveedor_granos", label: "Proveedor Granos" },
      { value: "industria", label: "Industria" },
    ]},
    { key: "regimen_control", label: "R\u00e9gimen de Control", type: "select", options: [
      { value: "", label: "N/A" },
      { value: "propio", label: "Propio" },
      { value: "arrendado", label: "Arrendado" },
      { value: "cenabico", label: "CENABICO" },
    ], hint: "Solo para establecimientos bajo gesti\u00f3n" },
    { key: "senacsa_code", label: "C\u00f3digo SENACSA", hint: "Se auto-completa al escribir el nombre" },
    { key: "senacsa_unidad_zonal", label: "Unidad Zonal SENACSA" },
    { key: "company", label: "Empresa", type: "select", options: "companies", required: true },
    { key: "manager", label: "Gerente Responsable", type: "user_select", roleFilter: "gerente" },
    { key: "departamento", label: "Departamento" },
    { key: "municipio", label: "Municipio" },
    { key: "location", label: "Ubicaci\u00f3n (texto libre)" },
    { key: "latitude", label: "Latitud", hint: "Ej: -23.3154" },
    { key: "longitude", label: "Longitud", hint: "Ej: -56.7123" },
    { key: "notas", label: "Notas", type: "textarea" },
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

export default function ParameterForm({ tab, item, onSave, onCancel, saving }) {
  const usersByRole = useMemo(() => {
    const users = getUsers().filter(u => u.active);
    return {
      gerente: users.filter(u => ["gerente", "admin"].includes(u.role))
        .map(u => ({ value: u.username, label: u.name })),
      diretoria: users.filter(u => ["diretoria", "admin"].includes(u.role))
        .map(u => ({ value: u.username, label: u.name })),
    };
  }, []);

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
    if (f.options === "companies") return companyOptions.map(o => ({ value: o, label: o }));
    if (Array.isArray(f.options)) {
      return f.options.map(o => typeof o === "string" ? { value: o, label: o } : o);
    }
    return [];
  };

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
    <div className="bg-[#F8F9FB]/[0.02] rounded-2xl p-5 border border-[#C8A03A]/[0.19] mb-4">
      <div className="text-sm font-semibold text-white mb-4">
        {item ? `Editar: ${item.name}` : "Nuevo Registro"}
      </div>

      {/* SENACSA auto-fill indicator */}
      {senacsaAutoFilled && tab === "establishments" && (
        <div className="px-3 py-2 rounded-lg mb-3 bg-green-500/[0.06] border border-green-500/[0.19] text-[11px] text-green-400 font-medium">
          {"✓"} Datos SENACSA auto-completados desde la base de referencia
        </div>
      )}

      <div className="flex flex-col gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5 tracking-wide">
              {f.label} {f.required && <span className="text-red-400">*</span>}
            </label>
            {f.hint && (
              <div className="text-[10px] text-slate-500 mb-0.5 italic">
                {f.hint}
              </div>
            )}
            {f.type === "textarea" ? (
              <textarea
                value={form[f.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.label}
                disabled={saving}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-[13px] text-white outline-none transition-colors focus:border-[#C8A03A]/50 resize-none"
              />
            ) : f.type === "select" ? (
              <select
                value={form[f.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                disabled={saving}
                className="w-full px-3 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-[13px] text-white outline-none transition-colors focus:border-[#C8A03A]/50"
              >
                <option value="">Seleccionar...</option>
                {resolveOptions(f).map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "user_select" ? (
              <select
                value={form[f.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                disabled={saving}
                className="w-full px-3 py-2.5 rounded-lg border border-white/[0.1] bg-[#F8F9FB]/[0.05] text-[13px] text-white outline-none transition-colors focus:border-[#C8A03A]/50"
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
                className={`w-full px-3 py-2.5 rounded-lg border bg-[#F8F9FB]/[0.05] text-[13px] text-white outline-none transition-colors focus:border-[#C8A03A]/50 ${
                  senacsaAutoFilled && ["senacsa_code", "senacsa_unidad_zonal", "latitude", "longitude", "departamento", "municipio"].includes(f.key) && form[f.key]
                    ? 'bg-green-500/[0.05] border-green-500/25'
                    : 'border-white/[0.1]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Map preview if coordinates exist */}
      {tab === "establishments" && form.latitude && form.longitude && (
        <div className="mt-3">
          <label className="block text-[11px] font-medium text-slate-400 mb-1 tracking-wide">
            {"📍"} Vista previa ubicaci{"ó"}n
          </label>
          <div className="rounded-xl overflow-hidden border border-white/[0.06] h-[180px]">
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
          <div className="text-[10px] text-slate-400 mt-1 text-center">
            Lat: {form.latitude} &middot; Lng: {form.longitude}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={onCancel} disabled={saving} className={`flex-1 py-3 rounded-xl border border-white/[0.06] bg-[#F8F9FB]/[0.03] text-white text-[13px] font-semibold ${saving ? 'cursor-default' : 'cursor-pointer'}`}>
          Cancelar
        </button>
        <button
          onClick={() => canSubmit && onSave(form)}
          disabled={!canSubmit}
          className={`flex-1 py-3 rounded-xl border-none text-[13px] font-semibold ${
            canSubmit
              ? 'bg-gradient-to-br from-[#1F2A44] to-[#C8A03A] text-white cursor-pointer'
              : 'bg-[#F8F9FB]/[0.06] text-slate-500 cursor-default'
          }`}
        >
          {saving ? "Guardando..." : (item ? "Guardar Cambios" : "Crear")}
        </button>
      </div>
    </div>
  );
}
