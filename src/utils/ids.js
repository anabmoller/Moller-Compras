// ============================================================
// YPOTI — Secure ID Generation
// Uses crypto.getRandomValues for unpredictable IDs
// ============================================================

/**
 * Generate a unique request ID in format SC-YYYY-XXXXX
 * where XXXXX is a random alphanumeric string
 */
export function generateRequestId() {
  const year = new Date().getFullYear();
  const random = generateRandomString(5);
  return `SC-${year}-${random}`;
}

/**
 * Generate a unique budget ID
 */
export function generateBudgetId() {
  return `b${generateRandomString(6)}`;
}

/**
 * Generate a unique user ID
 */
export function generateUserId() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return `u${array[0].toString(36)}`;
}

/**
 * Generate a unique comment ID
 */
export function generateCommentId() {
  return `C-${generateRandomString(8)}`;
}

/**
 * Generate a unique quotation ID
 */
export function generateQuotationId() {
  return `Q-${generateRandomString(8)}`;
}

/**
 * Generate a random alphanumeric string of given length
 * Uses crypto.getRandomValues for security
 */
function generateRandomString(length) {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join("");
}
