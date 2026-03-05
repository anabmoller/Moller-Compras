// ============================================================
// YPOTI — Input Sanitization
// Defense-in-depth: sanitize user inputs before storage
// ============================================================

/**
 * Sanitize a text string — strips HTML tags, trims whitespace,
 * and limits length. Safe for storage and display.
 */
export function sanitizeText(input, maxLength = 500) {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")    // Strip HTML tags
    .replace(/&lt;/g, "<")      // Decode common entities (then re-strip)
    .replace(/<[^>]*>/g, "")    // Second pass after entity decode
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a name (person, supplier, item) — alphanumeric + common punctuation
 */
export function sanitizeName(input, maxLength = 200) {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF.,\-'()\/&ñÑ#°]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a numeric input — returns a safe number or 0
 */
export function sanitizeNumber(input, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const num = typeof input === "string" ? parseFloat(input) : Number(input);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.max(min, Math.min(max, num));
}

/**
 * Sanitize a multiline text field (notes, comments, reasons)
 */
export function sanitizeMultiline(input, maxLength = 2000) {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}
