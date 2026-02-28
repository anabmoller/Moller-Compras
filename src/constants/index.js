// ============================================================
// YPOTI COMPRAS — CONSTANTES DE UI (PDR v3)
// Reference data (companies, establishments, sectors, etc.)
// now lives in Supabase — see parameters.js
// ============================================================

// ---- Priority Levels (PDR 3.3) ----
export const PRIORITY_LEVELS = [
  { value: "baja", label: "Baja", days: 15, color: "#6B7280", colorLight: "#F3F4F6", icon: "○" },
  { value: "media", label: "Media", days: 8, color: "#F59E0B", colorLight: "#FFFBEB", icon: "◆" },
  { value: "alta", label: "Alta", hours: 72, color: "#F97316", colorLight: "#FFF7ED", icon: "▲" },
  { value: "emergencial", label: "Emergencial", hours: 24, color: "#EF4444", colorLight: "#FEF2F2", icon: "⚠" },
];

// Keep legacy urgency levels for backward compat
export const URGENCY_LEVELS = PRIORITY_LEVELS;

// ---- Status Flow — 9 lifecycle states (PDR 3.4) ----
export const STATUS_FLOW = [
  { key: "borrador", label: "Borrador", color: "#6B7280", colorLight: "#F3F4F6", icon: "📝", step: 0 },
  { key: "cotizacion", label: "Cotización", color: "#8B5CF6", colorLight: "#F5F3FF", icon: "💬", step: 1 },
  { key: "presupuestado", label: "Presupuestado", color: "#3B82F6", colorLight: "#EFF6FF", icon: "💰", step: 2 },
  { key: "pendiente_aprobacion", label: "Pend. Aprobación", color: "#F59E0B", colorLight: "#FFFBEB", icon: "⏳", step: 3 },
  { key: "aprobado", label: "Aprobado", color: "#059669", colorLight: "#ECFDF5", icon: "✅", step: 4 },
  { key: "en_proceso", label: "En Proceso", color: "#2563EB", colorLight: "#EFF6FF", icon: "🔄", step: 5 },
  { key: "recibido", label: "Recibido", color: "#10B981", colorLight: "#ECFDF5", icon: "📦", step: 6 },
  { key: "facturado", label: "Facturado", color: "#6366F1", colorLight: "#EEF2FF", icon: "🧾", step: 7 },
  { key: "registrado_sap", label: "Registrado SAP", color: "#006633", colorLight: "#E8F5EE", icon: "🏁", step: 8 },
];

// Extra statuses
export const EXTRA_STATUSES = [
  { key: "rechazado", label: "Rechazado", color: "#DC2626", colorLight: "#FEF2F2", icon: "❌" },
  { key: "cancelado", label: "Cancelado", color: "#6B7280", colorLight: "#F3F4F6", icon: "🚫" },
];

// ---- Product group colors (UI only) ----
export const GROUP_COLORS = {
  Veterinaria: "#DC2626",
  "Nutrición": "#059669",
  "Agrícola": "#2563EB",
  Operacional: "#F97316",
  Mantenimiento: "#8B5CF6",
  Taller: "#6B7280",
  "Ganadería": "#D97706",
  Hacienda: "#006633",
  Personal: "#EC4899",
  Combustible: "#F59E0B",
};

// ---- SAP Catalog items (PDR 6) ----
export const INVENTORY_ITEMS = [
  { code: "AGRO-000004", name: "MAÍZ HÚMEDO", type: "Insumo Agrícola", group: "Nutrición", transactions: 1390 },
  { code: "AGRO-000009", name: "BURLANDA (DDGS)", type: "Insumo Agrícola", group: "Nutrición", transactions: 871 },
  { code: "AGRO-000010", name: "AFRECHO DE ARROZ", type: "Insumo Agrícola", group: "Nutrición", transactions: 636 },
  { code: "AGRO-000003", name: "MAÍZ SECO", type: "Insumo Agrícola", group: "Nutrición", transactions: 573 },
  { code: "AGRO-000008", name: "CASCARILLA DE SOJA", type: "Insumo Agrícola", group: "Nutrición", transactions: 476 },
  { code: "AGRO-000020", name: "BAGAZO DE CAÑA", type: "Insumo Agrícola", group: "Nutrición", transactions: 298 },
  { code: "AGRO-000012", name: "CALCÁREO CALCÍTICO", type: "Insumo Agrícola", group: "Agrícola", transactions: 224 },
  { code: "AGRO-000043", name: "SEMILLA DE ALGODÓN", type: "Insumo Agrícola", group: "Agrícola", transactions: 153 },
  { code: "AGRO-000006", name: "AVENA", type: "Insumo Agrícola", group: "Nutrición", transactions: 130 },
  { code: "AGRO-000005", name: "SORGO", type: "Insumo Agrícola", group: "Nutrición", transactions: 74 },
  { code: "AGRO-000007", name: "HARINA DE SOJA", type: "Insumo Agrícola", group: "Nutrición", transactions: 60 },
  { code: "AGRO-000015", name: "UREA", type: "Insumo Agrícola", group: "Agrícola", transactions: 57 },
  { code: "AGRO-000011", name: "SAL MARINA", type: "Insumo Agrícola", group: "Nutrición", transactions: 37 },
  { code: "AGRO-000047", name: "ABONO", type: "Insumo Agrícola", group: "Agrícola", transactions: 36 },
  { code: "AGRO-000050", name: "NÚCLEO F1", type: "Suplemento", group: "Nutrición", transactions: 29 },
  { code: "AGRO-000056", name: "RURAL 90 CRÍA", type: "Suplemento", group: "Nutrición", transactions: 27 },
  { code: "AGRO-000045", name: "TRIGUILLO", type: "Insumo Agrícola", group: "Nutrición", transactions: 24 },
  { code: "AGRO-000018", name: "SEMILLA DE NABO", type: "Insumo Agrícola", group: "Agrícola" },
  { code: "MER-000004", name: "SEMILLA PASTURA", type: "Insumo Agrícola", group: "Agrícola" },
  { code: "MER-000034", name: "SILO BOLSAS", type: "Insumo Agrícola", group: "Agrícola" },
  { code: "HAC-000001", name: "DESMAMANTE MACHO", type: "Hacienda", group: "Hacienda", transactions: 1645 },
  { code: "HAC-000005", name: "TORO", type: "Hacienda", group: "Hacienda", transactions: 132 },
  { code: "HAC-000012", name: "TORETÓN", type: "Hacienda", group: "Hacienda", transactions: 130 },
  { code: "HAC-000007", name: "TERNERO", type: "Hacienda", group: "Hacienda", transactions: 102 },
  { code: "HAC-000009", name: "EQUINO", type: "Hacienda", group: "Hacienda", transactions: 31 },
  { code: "MER-000001", name: "COMBUSTIBLE DIESEL", type: "Combustible", group: "Combustible", transactions: 108 },
  { code: "MER-000073", name: "COMBUSTIBLE NAFTA", type: "Combustible", group: "Combustible", transactions: 83 },
  { code: "MER-000043", name: "ACEITE 15W40", type: "Lubricante", group: "Mantenimiento", transactions: 44 },
  { code: "MER-000042", name: "ACEITE 10W30", type: "Lubricante", group: "Mantenimiento", transactions: 35 },
  { code: "VET-000002", name: "CLOSTRISAN", type: "Medicamento Vet.", group: "Veterinaria", transactions: 32 },
  { code: "VET-000009", name: "NEUMOSAN 20/50 DOSIS", type: "Medicamento Vet.", group: "Veterinaria" },
  { code: "MER-000029", name: "AFTOMUNE", type: "Medicamento Vet.", group: "Veterinaria" },
  { code: "MER-000019", name: "VACUNA POLI-STAR", type: "Medicamento Vet.", group: "Veterinaria" },
  { code: "MER-000005", name: "VACUNA IR9", type: "Medicamento Vet.", group: "Veterinaria" },
  { code: "MER-000025", name: "MOTOSIERRA HUSQVARNA", type: "Equipamiento", group: "Operacional" },
  { code: "MER-000028", name: "HIDROLAVADORA", type: "Equipamiento", group: "Mantenimiento" },
  { code: "MER-000016", name: "TALADRO IRWIN", type: "Herramienta", group: "Taller" },
  { code: "MER-000014", name: "CARAVANA MACHO", type: "Equipamiento", group: "Ganadería" },
  { code: "MER-000020", name: "CAPA DE LLUVIA 1.60M", type: "Uniformes", group: "Personal" },
  { code: "MER-000021", name: "CAPA DE LLUVIA 1.80M", type: "Uniformes", group: "Personal" },
];
