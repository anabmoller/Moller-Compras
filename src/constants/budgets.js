// ============================================================
// YPOTI — BUDGET (PRESUPUESTOS) POR AREA
// Reads via anon client (RLS), writes via Edge Functions
// ============================================================

import { supabase, supabaseUrl, supabaseAnonKey, getStoredToken } from "../lib/supabase";

// ---- Edge Function helper (same pattern as queries.js) ----
async function invokeAdminData(body) {
  let token = getStoredToken();

  if (!token) {
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 5000)),
      ]);
      token = result?.data?.session?.access_token;
    } catch { /* timeout */ }
  }

  if (!token) throw new Error("No hay sesión activa.");

  const res = await fetch(`${supabaseUrl}/functions/v1/admin-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || errBody.message || `Error ${res.status}`);
  }

  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return data;
}

// ---- Module-level cache ----
let _budgets = [];

// ============================================================
// INIT — Load budgets from Supabase (anon + RLS)
// ============================================================

export async function initBudgets() {
  try {
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .order("establishment", { ascending: true });

    if (error) throw error;

    _budgets = (data || []).map(b => ({
      id: b.id,                  // UUID (primary key)
      legacyId: b.legacy_id,    // "b001" etc. (for reference)
      name: b.name,
      establishment: b.establishment,
      sector: b.sector,
      period: b.period,
      startDate: b.start_date,
      endDate: b.end_date,
      planned: Number(b.planned) || 0,
      consumed: Number(b.consumed) || 0,
      active: b.active !== false,
    }));

  } catch (err) {
    console.error("[Budgets] Init failed:", err);
  }
}

// ============================================================
// SYNCHRONOUS GETTERS
// ============================================================

export function getBudgets() {
  return _budgets;
}

export function getBudgetsByEstablishment(establishment) {
  return _budgets.filter(b => b.active && b.establishment === establishment);
}

// ============================================================
// ASYNC CRUD — Write via Edge Functions
// ============================================================

export async function addBudget(budget) {
  const data = await invokeAdminData({ action: "add-budget", budget });
  await initBudgets(); // refresh cache
  return data?.data;
}

export async function updateBudget(id, updates) {
  await invokeAdminData({ action: "update-budget", budgetId: id, updates });
  // Update local cache immediately
  _budgets = _budgets.map(b => b.id === id ? { ...b, ...updates } : b);
}

export function saveBudgets() {
  // No-op in Supabase mode (backward compat)
}

export async function resetBudgetsToDefault() {
  await initBudgets();
  return _budgets;
}

// ============================================================
// PURE QUERY HELPERS (unchanged interface)
// ============================================================

/** Find the best matching budget for a purchase request */
export function findBudgetForPR(establishment, sector) {
  let budget = _budgets.find(b =>
    b.active && b.establishment === establishment && b.sector === sector
  );
  if (budget) return budget;

  budget = _budgets.find(b =>
    b.active && b.establishment === establishment
  );
  return budget || null;
}

/** Get remaining budget amount */
export function getBudgetRemaining(budget) {
  if (!budget) return null;
  return budget.planned - budget.consumed;
}

/** Check if a PR amount would exceed the budget */
export function wouldExceedBudget(budget, amount) {
  if (!budget) return false;
  return (budget.consumed + amount) > budget.planned;
}

/** Get budget usage percentage (0-100+) */
export function getBudgetPercent(budget) {
  if (!budget || budget.planned === 0) return 0;
  return Math.round((budget.consumed / budget.planned) * 100);
}

/** Format guaranies */
export function formatGuaranies(amount) {
  if (amount == null) return "\u2014";
  return "\u20B2 " + Math.round(amount).toLocaleString("es-PY");
}
