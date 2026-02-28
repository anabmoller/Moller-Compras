// ============================================================
// YPOTI — Input Sanitization (Edge Function port)
// Port of src/utils/sanitize.js → TypeScript
// ============================================================

/** Sanitize a text string — strips HTML tags, trims, limits length */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Sanitize a name (person, supplier, item) — alphanumeric + common punctuation */
export function sanitizeName(input: unknown, maxLength = 200): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF.,\-'()\/&\u00F1\u00D1#\u00B0]/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Sanitize a numeric input — returns a safe number or 0 */
export function sanitizeNumber(
  input: unknown,
  opts: { min?: number; max?: number } = {},
): number {
  const { min = 0, max = Number.MAX_SAFE_INTEGER } = opts;
  const num = typeof input === "string" ? parseFloat(input) : Number(input);
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.max(min, Math.min(max, num));
}

/** Sanitize an email/username input */
export function sanitizeEmail(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

/** Sanitize a multiline text field (notes, comments, reasons) */
export function sanitizeMultiline(input: unknown, maxLength = 2000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}
