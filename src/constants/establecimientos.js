// ============================================================
// ESTABLECIMIENTOS — Group-owned establishments
// These are internal properties managed by the group.
// ============================================================

/**
 * Canonical list of group-owned establishments.
 * Used as fallback when Supabase is unavailable and as the
 * source of truth for Panel General filters.
 */
export const ESTABLECIMIENTOS_PROPIOS = [
  { key: "cerro_memby",   nombre: "Cerro Memby" },
  { key: "ypoti",          nombre: "Ypoti" },
  { key: "santa_clara",    nombre: "Santa Clara" },
  { key: "oro_verde",      nombre: "Oro Verde" },
  { key: "santa_maria",    nombre: "Santa Maria da Serra" },
  { key: "cielo_azul",     nombre: "Cielo Azul" },
  { key: "ybypora",        nombre: "Yby Porã" },
  { key: "yby_pyta",       nombre: "Yby Pytã" },
  { key: "lusipar",        nombre: "Lusipar" },
];

/**
 * Entity type labels for UI display
 */
export const TIPO_ENTIDAD_LABELS = {
  establecimiento:  "Establecimiento",
  proveedor_ganado: "Proveedor Ganado",
  proveedor_granos: "Proveedor Granos",
  industria:        "Industria",
};

/**
 * Regimen control labels for UI display
 */
export const REGIMEN_CONTROL_LABELS = {
  propio:    "Propio",
  arrendado: "Arrendado",
  cenabico:  "CENABICO",
};

/**
 * Filter group-managed establishments (tipo_entidad = 'establecimiento')
 * Accepts optional regimen filter.
 */
export function filterGroupEstablishments(dbEstablishments = [], regimen = null) {
  return dbEstablishments.filter(
    (e) =>
      e.tipo_entidad === "establecimiento" &&
      e.active !== false &&
      (!regimen || e.regimen_control === regimen)
  );
}

/**
 * Filter by tipo_entidad
 */
export function filterByTipoEntidad(dbEstablishments = [], tipo) {
  if (!tipo || tipo === "todos") return dbEstablishments;
  return dbEstablishments.filter((e) => e.tipo_entidad === tipo);
}

// ============================================================
// ACTIVE PROVIDER NETWORK — Purchase-centric visibility
// ============================================================
// HACIENDA is a purchase-centric cattle operation.
// Most animals are purchased, not born on our farms.
// These are the default-visible providers/groups in our
// operational network. Other providers exist in the DB but
// only appear when explicitly searched or activated.
// ============================================================

export const ACTIVE_PROVIDERS = [
  { key: "rural_energia",  nombre: "Rural Energia" },
  { key: "chacobras",      nombre: "Chacobras" },
  { key: "beatriz",        nombre: "Beatriz" },
  { key: "gabriel",        nombre: "Gabriel" },
  { key: "pedro",          nombre: "Pedro" },
  { key: "la_constancia",  nombre: "La Constância" },
];

/** Normalized active provider names for matching against DB records */
const _activeProviderNames = ACTIVE_PROVIDERS.map(p =>
  p.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
);

/**
 * Check if a provider/establishment name belongs to the active network.
 * Matches are case-insensitive and accent-insensitive.
 */
export function isActiveProvider(name) {
  if (!name) return false;
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return _activeProviderNames.some(ap => normalized.includes(ap) || ap.includes(normalized));
}

/**
 * Filter establishments/providers to only show active network by default.
 * When showAll=true, returns all records (exploration mode).
 */
export function filterActiveNetwork(records = [], { showAll = false, nameField = "nome" } = {}) {
  if (showAll) return records;
  return records.filter(r => isActiveProvider(r[nameField] || r.name || r.nombre || ""));
}

// ============================================================
// ENTRY TYPE INFERENCE — Purchase vs Birth classification
// ============================================================
// Business rule: If an animal's first recorded weight is above
// ~90-100 kg, assume it was PURCHASED, not born on our farm,
// unless there is explicit birth evidence.
// Traceability starts when the animal enters our operational
// universe, not before.
// ============================================================

export const PURCHASE_WEIGHT_THRESHOLD_KG = 90;

/**
 * Infer whether an animal was purchased or born on the farm.
 * @param {Object} animal - Animal record with entry_weight and optional birth_evidence
 * @returns {"purchased"|"born"|"unknown"}
 */
export function inferEntryType(animal) {
  if (!animal) return "unknown";
  // Explicit birth evidence overrides weight inference
  if (animal.birth_evidence || animal.birth_date || animal.dam_id) return "born";
  // Weight-based inference
  const weight = animal.entry_weight || animal.current_weight || 0;
  if (weight >= PURCHASE_WEIGHT_THRESHOLD_KG) return "purchased";
  if (weight > 0 && weight < PURCHASE_WEIGHT_THRESHOLD_KG) return "born";
  return "unknown";
}
