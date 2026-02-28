// ============================================================
// YPOTI — Status Display Helpers (PDR v3 — 9 lifecycle states)
// ============================================================
import { STATUS_FLOW, EXTRA_STATUSES, PRIORITY_LEVELS } from "../constants";

const ALL_STATUSES = [...STATUS_FLOW, ...EXTRA_STATUSES];

/**
 * Get display properties for a request status.
 * Returns { key, label, color, colorLight, icon } for any status.
 */
export function getStatusDisplay(status) {
  return (
    ALL_STATUSES.find((s) => s.key === status) || {
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
  const idx = STATUS_FLOW.findIndex((s) => s.key === status);
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

/**
 * Format guaraníes: ₲ 1.500.000
 */
export function formatGuaranies(amount) {
  if (!amount && amount !== 0) return "—";
  return `₲ ${Number(amount).toLocaleString("es-PY")}`;
}
