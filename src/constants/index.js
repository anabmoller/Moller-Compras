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

// ---- Status Flow — 9 lifecycle states (MEGA_PROMPT spec) ----
export const STATUS_FLOW = [
  { key: "borrador", label: "Borrador", color: "#6b7994", colorLight: "#F3F4F6", icon: "📝", step: 0 },
  { key: "pend_autorizacion", label: "Pend. Autorización", color: "#c8922a", colorLight: "#FFFBEB", icon: "👤", step: 1 },
  { key: "autorizado", label: "Autorizado", color: "#3a7fd4", colorLight: "#EFF6FF", icon: "✅", step: 2 },
  { key: "en_cotizacion", label: "En Cotización", color: "#7c6bb5", colorLight: "#F5F3FF", icon: "💰", step: 3 },
  { key: "pend_aprobacion", label: "Pend. Aprobación", color: "#f59e0b", colorLight: "#FFFBEB", icon: "📋", step: 4 },
  { key: "aprobado", label: "Aprobado", color: "#10b981", colorLight: "#ECFDF5", icon: "✔", step: 5 },
  { key: "orden_compra", label: "Orden de Compra", color: "#2a8c6d", colorLight: "#ECFDF5", icon: "📦", step: 6 },
  { key: "recibido", label: "Recibido", color: "#4a9c6d", colorLight: "#ECFDF5", icon: "📥", step: 7 },
  { key: "sap", label: "Registrado SAP", color: "#1a6b4a", colorLight: "#E8F5EE", icon: "🏁", step: 8 },
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
  "Mercadería": "#8B5CF6",
  Operacional: "#F97316",
  Mantenimiento: "#8B5CF6",
  Taller: "#6B7280",
  "Ganadería": "#D97706",
  Hacienda: "#006633",
  Personal: "#EC4899",
  Combustible: "#F59E0B",
};

// ---- SAP Catalog items (PDR 6) — Full 204-product catalog ----
// Full catalog with pricing data lives in catalogs.js
// INVENTORY_ITEMS adapts it for backward-compat with components (code, name, group, unit, transactions)
import { FULL_PRODUCT_CATALOG, FULL_SUPPLIER_CATALOG } from "./catalogs";

export { FULL_PRODUCT_CATALOG, FULL_SUPPLIER_CATALOG };

export const INVENTORY_ITEMS = FULL_PRODUCT_CATALOG.map(p => ({
  code: p.c,
  name: p.n,
  group: p.g,
  unit: p.u,
  type: p.g,
  transactions: p.tp || 0,
  avgPrice: p.ap,
  lastPrice: p.lp,
  lastDate: p.ld,
  lastSupplier: p.ls,
  suppliers: p.ss,
}));

// ---- Sample Requests (5 multi-item purchase requests for demo/seed) ----
export const SAMPLE_REQUESTS = [
  {
    id: "SC-2026-001",
    items: [
      { product: "MAIZ SECO", code: "AGRO-000003", qty: 100, unit: "tonelada", estimatedAmount: 128200000 },
      { product: "BURLANDA", code: "AGRO-000009", qty: 50, unit: "tonelada", estimatedAmount: 85450000 },
    ],
    totalAmount: 213650000,
    urgency: "Alta",
    establishment: "Ypoti",
    sector: "Confinamento",
    requester: "Alberto",
    status: "en_cotizacion",
    date: "2026-02-15",
    assignee: "Laura Rivas",
    reason: "Reposicion mensual de materia prima para feedlot",
  },
  {
    id: "SC-2026-002",
    items: [
      { product: "CLOSTRISAN", code: "VET-000002", qty: 20, unit: "unidad", estimatedAmount: 3200000 },
    ],
    totalAmount: 3200000,
    urgency: "Media",
    establishment: "Cerro Memby",
    sector: "Veterinaria",
    requester: "Rodrigo Ferreira",
    status: "pend_autorizacion",
    date: "2026-02-28",
    assignee: "Laura Rivas",
    reason: "Vacunacion programada marzo",
  },
  {
    id: "SC-2026-003",
    items: [
      { product: "COMBUSTIBLE", code: "MER-000001", qty: 5000, unit: "litro", estimatedAmount: 42500000 },
      { product: "COMBUSTIBLE NAFTA", code: "MER-000073", qty: 1000, unit: "litro", estimatedAmount: 9800000 },
    ],
    totalAmount: 52300000,
    urgency: "Alta",
    establishment: "Lusipar",
    sector: "Logistica",
    requester: "Ramon Sosa",
    status: "aprobado",
    date: "2026-02-20",
    assignee: "Guillermo Caceres",
    reason: "Abastecimiento mensual combustible",
  },
  {
    id: "SC-2026-004",
    items: [
      { product: "CARAVANA MACHO", code: "MER-000014", qty: 500, unit: "unidad", estimatedAmount: 15000000 },
      { product: "ALFORGE CUERO", code: "MER-000023", qty: 10, unit: "unidad", estimatedAmount: 2800000 },
    ],
    totalAmount: 17800000,
    urgency: "Baja",
    establishment: "Santa Clara",
    sector: "Recria",
    requester: "Evaristo Ortigoza",
    status: "borrador",
    date: "2026-03-01",
    assignee: "Laura Rivas",
    reason: "Material para marcacion de terneros",
  },
  {
    id: "SC-2026-005",
    items: [
      { product: "UREA", code: "AGRO-000015", qty: 25, unit: "tonelada", estimatedAmount: 117500000 },
    ],
    totalAmount: 117500000,
    urgency: "Media",
    establishment: "Cielo Azul",
    sector: "Agricultura",
    requester: "Fabiano Ferreira",
    status: "autorizado",
    date: "2026-02-25",
    assignee: "Ana Karina",
    reason: "Fertilizacion de pasturas Q2",
  },
];
