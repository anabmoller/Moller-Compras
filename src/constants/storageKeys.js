// ============================================================
// YPOTI — Centralized localStorage Key Registry
// All localStorage keys in one place to prevent typos
// and make data management easier (reset, export, etc.)
// ============================================================

export const STORAGE_KEYS = {
  REQUESTS: "ypoti_requests",
  AUTH: "ypoti_auth",
  USERS: "ypoti_users",
  BUDGETS: "ypoti_budgets",
  PARAMETERS: "ypoti_parameters",
};

/**
 * Clear all app data from localStorage.
 * Used by reset functionality in SettingsScreen.
 */
export function clearAllAppData() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
