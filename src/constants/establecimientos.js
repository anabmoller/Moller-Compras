// ============================================================
// ESTABLECIMIENTOS — Group-owned establishments (tipo = 'propio')
// These are internal properties and NEVER include providers
// or external destinations (frigoríficos, terceros).
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
 * Map an establishment DB record to the standard shape.
 * Only returns records where tipo = 'propio' and active = true.
 */
export function filterGroupEstablishments(dbEstablishments = []) {
  return dbEstablishments.filter(
    (e) => e.tipo === "propio" && e.active !== false
  );
}
