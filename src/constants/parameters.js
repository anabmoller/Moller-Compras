// ============================================================
// YPOTI — ADMIN PARAMETERS (Módulo 7)
// Establishments, Sectors, Product Types, Suppliers, Warehouses
// ============================================================

const PARAMS_KEY = "ypoti_parameters";

const DEFAULT_PARAMETERS = {
  establishments: [
    { id: "e1", name: "Ypoti", code: "YPT", company: "Rural Bioenergia S.A.", manager: "Fabiano", location: "Alto Paraná", active: true },
    { id: "e2", name: "Cerro Memby", code: "CMB", company: "Rural Bioenergia S.A.", manager: "Fabiano", location: "Alto Paraná", active: true },
    { id: "e3", name: "Cielo Azul", code: "CAZ", company: "Rural Bioenergia S.A.", manager: "Mauricio", location: "Canindeyú", active: true },
    { id: "e4", name: "Lusipar", code: "LSP", company: "Rural Bioenergia S.A.", manager: "Ronei", location: "San Pedro", active: true },
    { id: "e5", name: "Santa Maria", code: "STM", company: "Rural Bioenergia S.A.", manager: "Ronei", location: "Itapúa", active: true },
    { id: "e6", name: "Ybypora", code: "YBP", company: "Rural Bioenergia S.A.", manager: "Fabiano", location: "Alto Paraná", active: true },
    { id: "e7", name: "Santa Clara", code: "STC", company: "La Constancia", manager: "Mauricio", location: "Canindeyú", active: true },
    { id: "e8", name: "Yby Pyta", code: "YPY", company: "Rural Bioenergia S.A.", manager: "Mauricio", location: "Canindeyú", active: true },
    { id: "e9", name: "Oro Verde", code: "ORV", company: "Rural Bioenergia S.A.", manager: "Ronei", location: "Itapúa", active: true },
  ],
  sectors: [
    { id: "s1", name: "Recria", icon: "🐄", description: "Cría y recría de ganado", active: true },
    { id: "s2", name: "Confinamento", icon: "🏗", description: "Engorde a corral", active: true },
    { id: "s3", name: "Agricultura", icon: "🌾", description: "Producción agrícola", active: true },
    { id: "s4", name: "Administrativo", icon: "🏢", description: "Administración general", active: true },
    { id: "s5", name: "Manutenção", icon: "🔧", description: "Mantenimiento de equipos y estructuras", active: true },
    { id: "s6", name: "Veterinária", icon: "💉", description: "Sanidad animal", active: true },
    { id: "s7", name: "Logística", icon: "🚛", description: "Transporte y combustible", active: true },
    { id: "s8", name: "Oficina/Taller", icon: "🛠", description: "Taller mecánico y oficina", active: true },
    { id: "s9", name: "Farmacia", icon: "💊", description: "Productos farmacéuticos veterinarios", active: true },
  ],
  productTypes: [
    { id: "pt1", name: "Insumo", icon: "📦", description: "Insumos generales de operación", active: true },
    { id: "pt2", name: "Repuesto", icon: "⚙", description: "Repuestos para maquinaria y equipos", active: true },
    { id: "pt3", name: "Equipamento", icon: "🔩", description: "Equipamiento nuevo", active: true },
    { id: "pt4", name: "Maquinario", icon: "🚜", description: "Maquinaria pesada", active: true },
    { id: "pt5", name: "Herramienta", icon: "🔨", description: "Herramientas manuales y eléctricas", active: true },
    { id: "pt6", name: "Farmacia", icon: "💊", description: "Medicamentos y vacunas", active: true },
    { id: "pt7", name: "Herbicida", icon: "🧪", description: "Herbicidas y agroquímicos", active: true },
    { id: "pt8", name: "Provista", icon: "🍚", description: "Provisiones y alimentos", active: true },
    { id: "pt9", name: "Uniformes", icon: "👕", description: "Uniformes e indumentaria", active: true },
    { id: "pt10", name: "Utiles de oficina", icon: "📎", description: "Material de oficina", active: true },
  ],
  suppliers: [
    { id: "sup1", name: "Agropecuaria Don Mario", ruc: "80012345-6", phone: "0983 456 789", email: "ventas@donmario.com.py", category: "Insumos Agrícolas", active: true },
    { id: "sup2", name: "Veterinaria Central", ruc: "80023456-7", phone: "0971 234 567", email: "pedidos@vetcentral.com.py", category: "Farmacia Veterinaria", active: true },
    { id: "sup3", name: "Repuestos Guaraní", ruc: "80034567-8", phone: "0961 345 678", email: "info@repuestosguarani.com.py", category: "Repuestos Maquinaria", active: true },
    { id: "sup4", name: "COPETROL S.A.", ruc: "80045678-9", phone: "0984 567 890", email: "corporativo@copetrol.com.py", category: "Combustible", active: true },
    { id: "sup5", name: "Ferretería Industrial PY", ruc: "80056789-0", phone: "0975 678 901", email: "ventas@ferreteriapy.com", category: "Herramientas", active: true },
    { id: "sup6", name: "Nutrición Animal S.A.", ruc: "80067890-1", phone: "0982 789 012", email: "pedidos@nutrianimal.com.py", category: "Nutrición", active: true },
  ],
  companies: [
    { id: "c1", name: "Rural Bioenergia S.A.", ruc: "80098765-4", type: "empresa", director: "Paulo" },
    { id: "c2", name: "Chacobras", ruc: "80087654-3", type: "empresa", director: "Gabriel" },
    { id: "c3", name: "La Constancia", ruc: "80076543-2", type: "empresa", director: "Pedro Moller" },
    { id: "c4", name: "Control Pasto", ruc: "80065432-1", type: "empresa", director: "Gabriel" },
    { id: "c5", name: "Ana Moller", ruc: "3456789-0", type: "persona_fisica", director: "Ana Moller" },
    { id: "c6", name: "Gabriel Moller", ruc: "4567890-1", type: "persona_fisica", director: "Gabriel" },
    { id: "c7", name: "Pedro Moller", ruc: "5678901-2", type: "persona_fisica", director: "Pedro Moller" },
  ],
};

// ---- Persistence ----
function loadParams() {
  const saved = localStorage.getItem(PARAMS_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  localStorage.setItem(PARAMS_KEY, JSON.stringify(DEFAULT_PARAMETERS));
  return { ...DEFAULT_PARAMETERS };
}

let _params = loadParams();

function save() {
  localStorage.setItem(PARAMS_KEY, JSON.stringify(_params));
}

export function getParameters() { return _params; }

export function getEstablishments() { return _params.establishments.filter(e => e.active); }
export function getSectors() { return _params.sectors.filter(s => s.active); }
export function getProductTypes() { return _params.productTypes.filter(p => p.active); }
export function getSuppliers() { return _params.suppliers.filter(s => s.active); }
export function getCompanies() { return _params.companies; }

// ---- Generic CRUD for any category ----
export function addParameterItem(category, item) {
  const existing = _params[category] || [];
  const maxNum = existing.reduce((max, i) => {
    const num = parseInt(i.id.replace(/\D/g, ""), 10);
    return num > max ? num : max;
  }, 0);
  const prefix = category === "establishments" ? "e" :
    category === "sectors" ? "s" :
    category === "productTypes" ? "pt" :
    category === "suppliers" ? "sup" : "c";
  const newItem = { ...item, id: `${prefix}${maxNum + 1}`, active: true };
  _params = { ..._params, [category]: [...existing, newItem] };
  save();
  return newItem;
}

export function updateParameterItem(category, id, updates) {
  _params = {
    ..._params,
    [category]: (_params[category] || []).map(i => i.id === id ? { ...i, ...updates } : i),
  };
  save();
}

export function toggleParameterItem(category, id) {
  _params = {
    ..._params,
    [category]: (_params[category] || []).map(i =>
      i.id === id ? { ...i, active: !i.active } : i
    ),
  };
  save();
}

export function resetParametersToDefault() {
  _params = { ...DEFAULT_PARAMETERS };
  save();
  return _params;
}
