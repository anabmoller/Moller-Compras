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
  { key: "cerro_moimbi",          nombre: "Cerro Moimbí" },
  { key: "ypoti",                 nombre: "Ypotí" },
  { key: "santa_clara",           nombre: "Estancia Santa Clara" },
  { key: "ouro_verde",            nombre: "Ouro Verde" },
  { key: "santa_maria_das_neves", nombre: "Santa Maria das Neves" },
  { key: "vila_azul",             nombre: "Vila Azul" },
  { key: "ibirora",               nombre: "Ibirorã" },
  { key: "ibirapita",             nombre: "Ibirapitã" },
  { key: "serrumbi",              nombre: "Serrumbi" },
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
