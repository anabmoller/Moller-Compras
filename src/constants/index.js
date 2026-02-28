// ============================================================
// YPOTI COMPRAS — CONSTANTES Y DATOS (PDR v3)
// ============================================================

// ---- Companies (PDR 1.3) ----
export const COMPANIES = [
  { id: "rural_bio", name: "Rural Bioenergia S.A. (Ypoti)", ruc: "80092156-9", type: "empresa", activity: "Cría, recría y engorde bovino, agricultura, confinamiento" },
  { id: "chacobras", name: "Chacobras S.A.", ruc: "80055203-2", type: "empresa", activity: "Recría, engorde, hotelería bovina, núcleos proteicos" },
  { id: "constancia", name: "La Constancia S.A.", ruc: "80119386-9", type: "empresa", activity: "Ganadería y agricultura" },
  { id: "control_pasto", name: "Control Pasto S.A.", ruc: "---", type: "empresa", activity: "Servicios agrícolas" },
  { id: "ana_moller", name: "Ana Moller", ruc: "---", type: "persona_fisica", activity: "Inversiones ganaderas" },
  { id: "gabriel_moller", name: "Gabriel Moller", ruc: "---", type: "persona_fisica", activity: "Inversiones ganaderas" },
  { id: "pedro_moller", name: "Pedro Moller", ruc: "---", type: "persona_fisica", activity: "Inversiones ganaderas" },
];

// ---- Establishments (PDR 1.4) ----
export const ESTABLISHMENTS = [
  "Ypoti", "Cerro Memby", "Cielo Azul", "Lusipar",
  "Santa María da Serra", "Ybyporã", "Santa Clara", "Oro Verde", "Yby Pyta",
];

// ---- Sectors ----
export const SECTORS = [
  "Recría", "Confinamiento", "Agricultura", "Administrativo",
  "Mantenimiento", "Veterinaria", "Logística", "Taller", "Farmacia",
  "Feedlot", "Fábrica Balanceados",
];

// ---- Product Types ----
export const PRODUCT_TYPES = [
  "Insumo Agrícola", "Repuesto", "Equipamiento", "Maquinaria",
  "Herramienta", "Medicamento Veterinario", "Herbicida", "Provista",
  "Uniformes", "Útiles de Oficina", "Combustible", "Lubricante",
  "Suplemento Nutricional", "Material de Limpieza",
];

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

// ---- Authorization thresholds (PDR 3.2) ----
export const AUTH_THRESHOLDS = [
  { role: "gerente_operacional", label: "Gerente Operacional", min: 0, max: 5_000_000 },
  { role: "gerente_rrhh", label: "Gerente de RRHH", min: 0, max: 2_500_000 },
  { role: "gerente_financiero", label: "Gerente Financiero", min: 5_000_000, max: 50_000_000 },
  { role: "presidencia", label: "Presidencia", min: 50_000_000, max: Infinity },
];

// ---- SAP Warehouses (PDR 7) — 21 depósitos ----
export const SAP_WAREHOUSES = [
  { code: "DIESEL-YPOTI", name: "Diesel Ypoti", category: "Combustibles", establishment: "Ypoti" },
  { code: "DIESEL-CM", name: "Diesel Cerro Memby", category: "Combustibles", establishment: "Cerro Memby" },
  { code: "DIESEL-CA", name: "Diesel Cielo Azul", category: "Combustibles", establishment: "Cielo Azul" },
  { code: "DIESEL-LUS", name: "Diesel Lusipar", category: "Combustibles", establishment: "Lusipar" },
  { code: "NAFTA-YPOTI", name: "Nafta Ypoti", category: "Combustibles", establishment: "Ypoti" },
  { code: "RECRIA-YPOTI", name: "Recría Ypoti", category: "Recría", establishment: "Ypoti" },
  { code: "RECRIA-CM", name: "Recría Cerro Memby", category: "Recría", establishment: "Cerro Memby" },
  { code: "RECRIA-CA", name: "Recría Cielo Azul", category: "Recría", establishment: "Cielo Azul" },
  { code: "RECRIA-LUS", name: "Recría Lusipar", category: "Recría", establishment: "Lusipar" },
  { code: "RECRIA-SC", name: "Recría Santa Clara", category: "Recría", establishment: "Santa Clara" },
  { code: "RECRIA-SMS", name: "Recría Santa María da Serra", category: "Recría", establishment: "Santa María da Serra" },
  { code: "RECRIA-OV", name: "Recría Oro Verde", category: "Recría", establishment: "Oro Verde" },
  { code: "RECRIA-YBP", name: "Recría Ybyporã", category: "Recría", establishment: "Ybyporã" },
  { code: "FAB-BAL", name: "Fábrica Balanceados", category: "Producción", establishment: "Ypoti" },
  { code: "FEEDLOT-YPOTI", name: "Feedlot Ypoti", category: "Producción", establishment: "Ypoti" },
  { code: "AGRI", name: "Agricultura", category: "Producción", establishment: "Ypoti" },
  { code: "ALM-AGR-CM", name: "Almacén Agrícola C.M.", category: "Producción", establishment: "Cerro Memby" },
  { code: "TALLER", name: "Taller", category: "Soporte", establishment: "Ypoti" },
  { code: "FARMACIA", name: "Farmacia", category: "Soporte", establishment: "Ypoti" },
  { code: "ALM-GEN", name: "Almacén General", category: "Soporte", establishment: "Ypoti" },
  { code: "COMPRAS-TEMP", name: "Compras Temporal", category: "Soporte", establishment: "Ypoti" },
];

// Product group colors
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

// ---- Top Suppliers (PDR 5.2) ----
export const TOP_SUPPLIERS = [
  { name: "INPASA DEL PARAGUAY S.A.", transactions: 869, products: "Burlanda (DDGS)" },
  { name: "ADM PARAGUAY S.R.L.", transactions: 505, products: "Harina de soja, cascarilla" },
  { name: "CHACOBRAS S.A.", transactions: 361, products: "Núcleos, sal mineral" },
  { name: "SILOS 7 RIO VERDE S.A.", transactions: 349, products: "Granos, almacenaje" },
  { name: "AGRO ALIANZA S.A.", transactions: 251, products: "Afrecho de arroz" },
  { name: "AGROFERTIL S.A.", transactions: 180, products: "Insumos agrícolas" },
  { name: "AGROTEC S.A.", transactions: 167, products: "Insumos agrícolas" },
  { name: "TRANSPORTE SGC", transactions: 123, products: "Fletes y logística" },
  { name: "COMERCIAL OBREGÓN S.A.", transactions: 104, products: "Comercio general" },
  { name: "AGROZAFRA S.A.", transactions: 96, products: "Afrecho de arroz" },
  { name: "FERUSA NEGOCIOS S.A.", transactions: 95, products: "Ferretería industrial" },
  { name: "VILLA OLIVA RICE S.A.", transactions: 94, products: "Arroz, subproductos" },
  { name: "REPUESTOS RIO VERDE S.A.", transactions: 81, products: "Repuestos maquinaria" },
  { name: "AGROVETERINARIA CONSULT-PEC", transactions: 67, products: "Productos veterinarios" },
  { name: "COOPERATIVA CHORTITZER LTDA.", transactions: 67, products: "Cooperativa multirrubro" },
];

export const TEAM_MEMBERS = [
  "Paulo", "Alberto", "Fabiano", "Laura Rivas", "Ana Karina",
  "Carlos Mendez", "Juan Rodriguez", "Maria Lopez",
];

// ---- Sample Requests (updated for 9-state flow) ----
export const SAMPLE_REQUESTS = [
  { id: "SC-2026-001", name: "Cargador para Báscula de Lusipar", requester: "Alberto", establishment: "Lusipar", company: "rural_bio", type: "Equipamiento", sector: "Confinamiento", urgency: "emergencial", priority: "emergencial", status: "aprobado", date: "2026-02-05", quantity: 1, totalAmount: 8_500_000, approver: "Paulo", assignee: "Laura Rivas", reason: "Báscula sin funcionamiento", approvalSteps: null, approvalHistory: [], supplier: "FERUSA NEGOCIOS S.A." },
  { id: "SC-2026-002", name: "Compresor para Valtra cod 25", requester: "Alberto", establishment: "Ypoti", company: "rural_bio", type: "Repuesto", sector: "Mantenimiento", urgency: "emergencial", priority: "emergencial", status: "recibido", date: "2026-01-30", quantity: 1, totalAmount: 4_200_000, approver: "Paulo", assignee: "Laura Rivas", reason: "Valtra parada sin compresor", approvalSteps: null, approvalHistory: [], supplier: "REPUESTOS RIO VERDE S.A." },
  { id: "SC-2026-003", name: "Combustible Est. Servicio 101", requester: "Fabiano", establishment: "Ybyporã", company: "rural_bio", type: "Combustible", sector: "Logística", urgency: "alta", priority: "alta", status: "cotizacion", date: "2026-01-29", quantity: 500, totalAmount: 15_000_000, approver: "Fabiano", assignee: "Ana Karina", reason: "Abastecimiento mensual", approvalSteps: null, approvalHistory: [], supplier: "" },
  { id: "SC-2026-004", name: "Motobomba 3HP Cielo Azul", requester: "Ramon Sosa", establishment: "Cielo Azul", company: "rural_bio", type: "Equipamiento", sector: "Recría", urgency: "alta", priority: "alta", status: "pendiente_aprobacion", date: "2026-01-28", quantity: 1, totalAmount: 3_200_000, approver: "Mauricio", assignee: "Guillermo Caceres", reason: "Reposición bomba dañada", approvalSteps: null, approvalHistory: [], supplier: "" },
  { id: "SC-2026-005", name: "Pedido de Pilotín — Oficina", requester: "Elva Sanchez", establishment: "Ypoti", company: "rural_bio", type: "Útiles de Oficina", sector: "Administrativo", urgency: "baja", priority: "baja", status: "borrador", date: "2026-01-25", quantity: 20, totalAmount: 1_800_000, approver: "", assignee: "Anahi Aguirre", reason: "Stock mínimo alcanzado", approvalSteps: null, approvalHistory: [], supplier: "" },
  { id: "SC-2026-006", name: "Generador para Santa María", requester: "Ever Cristaldo", establishment: "Santa María da Serra", company: "rural_bio", type: "Maquinaria", sector: "Recría", urgency: "alta", priority: "alta", status: "en_proceso", date: "2026-01-20", quantity: 1, totalAmount: 25_000_000, approver: "Paulo", assignee: "Laura Rivas", reason: "Sin energía de respaldo", approvalSteps: null, approvalHistory: [], supplier: "COMERCIAL OBREGÓN S.A." },
  { id: "SC-2026-007", name: "Medicamentos Vet. Vacunación", requester: "Rodrigo Ferreira", establishment: "Ypoti", company: "rural_bio", type: "Medicamento Veterinario", sector: "Veterinaria", urgency: "alta", priority: "alta", status: "presupuestado", date: "2026-02-10", quantity: 50, totalAmount: 12_000_000, approver: "Gabriel", assignee: "Ana Karina", reason: "Vacunación programada", approvalSteps: null, approvalHistory: [], supplier: "AGROVETERINARIA CONSULT-PEC" },
  { id: "SC-2026-008", name: "Aceite mantenimiento preventivo", requester: "Alberto", establishment: "Ypoti", company: "rural_bio", type: "Lubricante", sector: "Mantenimiento", urgency: "media", priority: "media", status: "registrado_sap", date: "2026-01-15", quantity: 200, totalAmount: 3_600_000, approver: "Paulo", assignee: "Laura Rivas", reason: "Mantenimiento preventivo maquinaria", approvalSteps: null, approvalHistory: [], supplier: "COMERCIAL PROGRESO S.A.C.I." },
  { id: "SC-2026-009", name: "Equipo cercado eléctrico C.M.", requester: "Fabiano", establishment: "Cerro Memby", company: "rural_bio", type: "Equipamiento", sector: "Recría", urgency: "media", priority: "media", status: "cotizacion", date: "2026-02-08", quantity: 1, totalAmount: 7_500_000, approver: "Fabiano", assignee: "Guillermo Caceres", reason: "Nuevo potrero a cercar", approvalSteps: null, approvalHistory: [], supplier: "" },
  { id: "SC-2026-010", name: "Desmalezadora Yby Pyta", requester: "Evaristo Ortigoza", establishment: "Yby Pyta", company: "rural_bio", type: "Equipamiento", sector: "Agricultura", urgency: "alta", priority: "alta", status: "borrador", date: "2026-02-12", quantity: 1, totalAmount: 6_000_000, approver: "", assignee: "", reason: "Desmalezadora actual averiada", approvalSteps: null, approvalHistory: [], supplier: "" },
  { id: "SC-2026-011", name: "Burlanda 1.000 ton Feb.", requester: "Laura Rivas", establishment: "Ypoti", company: "rural_bio", type: "Insumo Agrícola", sector: "Feedlot", urgency: "media", priority: "media", status: "facturado", date: "2026-02-01", quantity: 1000, totalAmount: 180_000_000, approver: "Paulo", assignee: "Laura Rivas", reason: "Retiro mensual contrato anual", approvalSteps: null, approvalHistory: [], supplier: "INPASA DEL PARAGUAY S.A." },
  { id: "SC-2026-012", name: "Afrecho de arroz — Feedlot", requester: "Ana Karina", establishment: "Ypoti", company: "rural_bio", type: "Insumo Agrícola", sector: "Feedlot", urgency: "media", priority: "media", status: "en_proceso", date: "2026-02-15", quantity: 200, totalAmount: 24_000_000, approver: "Fabiano", assignee: "Ana Karina", reason: "Ración engorde", approvalSteps: null, approvalHistory: [], supplier: "AGRO ALIANZA S.A." },
];
