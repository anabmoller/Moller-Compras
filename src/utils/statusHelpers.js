// ============================================================
// YPOTI — Status Display Helpers (PDR v3 — 9 lifecycle states)
// ============================================================
import { STATUS_FLOW, EXTRA_STATUSES, PRIORITY_LEVELS } from "../constants";

const ALL_STATUSES = [...STATUS_FLOW, ...EXTRA_STATUSES];

// Legacy status keys → new flow keys (for data migrated from old schema)
const LEGACY_STATUS_MAP = {
  pendiente: "pend_autorizacion",
  pendiente_aprobacion: "pend_aprobacion",
  aprobacion_gerente: "pend_autorizacion",
  cotizacion: "en_cotizacion",
  presupuestado: "en_cotizacion",
  aprobacion_compra: "pend_aprobacion",
  en_proceso: "orden_compra",
  facturado: "sap",
  registrado_sap: "sap",
};

/**
 * Normalize a status key — maps legacy keys to the current 9-step flow.
 */
export function normalizeStatus(status) {
  return LEGACY_STATUS_MAP[status] || status;
}

/**
 * Get display properties for a request status.
 * Returns { key, label, color, colorLight, icon } for any status.
 * Handles both new and legacy status keys.
 */
export function getStatusDisplay(status) {
  const normalized = normalizeStatus(status);
  return (
    ALL_STATUSES.find((s) => s.key === normalized) || {
      key: status,
      label: status,
      color: "#6B7280",
      colorLight: "#F3F4F6",
      icon: "•",
    }
  );
}

/**
 * Get progress percentage through the pipeline (0–100).
 * Returns 0 for rejected/cancelled.
 */
export function getStatusProgress(status) {
  if (status === "rechazado" || status === "cancelado") return 0;
  const normalized = normalizeStatus(status);
  const idx = STATUS_FLOW.findIndex((s) => s.key === normalized);
  return idx >= 0 ? ((idx + 1) / STATUS_FLOW.length) * 100 : 0;
}

/**
 * Get priority display properties.
 */
export function getPriorityDisplay(priority) {
  return (
    PRIORITY_LEVELS.find((p) => p.value === priority) || {
      value: priority,
      label: priority || "—",
      color: "#6B7280",
      colorLight: "#F3F4F6",
      icon: "○",
    }
  );
}

// Re-export from budgets.js (single source of truth for currency formatting)
export { formatGuaranies } from "../constants/budgets";
