// ============================================================
// SIGAM — Currency & number formatting utilities
// Single source of truth for Guaraní / USD display
// ============================================================

/**
 * Format an amount as Paraguayan Guaraníes.
 * @param {number|null|undefined} amount
 * @returns {string} e.g. "₲ 1.234.567" or "—"
 */
export function formatGuaranies(amount) {
  if (amount == null) return "—";
  return "₲ " + Math.round(amount).toLocaleString("es-PY");
}

/**
 * Format an amount as US Dollars.
 * @param {number|null|undefined} amount
 * @returns {string} e.g. "US$ 1,234" or "—"
 */
export function formatUsd(amount) {
  if (amount == null) return "—";
  return "US$ " + Math.round(amount).toLocaleString("en-US");
}

/**
 * Convert PYG to USD at a given rate.
 * @param {number} pyg - Amount in Guaraníes
 * @param {number} rate - USD→PYG exchange rate (e.g. 7800)
 * @returns {number}
 */
export function pygToUsd(pyg, rate) {
  if (!rate || rate === 0) return 0;
  return pyg / rate;
}

/**
 * Convert USD to PYG at a given rate.
 * @param {number} usd - Amount in US Dollars
 * @param {number} rate - USD→PYG exchange rate (e.g. 7800)
 * @returns {number}
 */
export function usdToPyg(usd, rate) {
  return usd * (rate || 7800);
}

/**
 * Format a number with thousands separators (es-PY locale).
 * @param {number|null|undefined} n
 * @returns {string}
 */
export function formatNumber(n) {
  if (n == null) return "—";
  return Math.round(n).toLocaleString("es-PY");
}
