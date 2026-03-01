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

/**
 * Relative time string from a timestamp (ms).
 * Returns "ahora", "hace Xm", "hace Xh", "hace Xd".
 */
export function relativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}
