// ============================================================
// YPOTI — Date Formatting Utilities
// Centralized date formatting (es-PY locale).
// Used by RequestDetail, ApprovalFlow, and other components.
// ============================================================

/**
 * Format ISO date string as dd/mm/yyyy (es-PY locale).
 * Returns "—" for null/invalid dates.
 */
export function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format ISO date string as "dd Mon HH:mm" (es-PY locale).
 * Returns "" for null/invalid dates.
 */
export function fmtDateTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return (
    dt.toLocaleDateString("es-PY", { day: "2-digit", month: "short" }) +
    " " +
    dt.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })
  );
}
