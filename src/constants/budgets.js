// ============================================================
// YPOTI — BUDGET (PRESUPUESTOS) POR ÁREA
// Módulo 10 — Presupuestos con persistencia localStorage
// ============================================================

const BUDGETS_STORAGE_KEY = "ypoti_budgets";

// ---- Presupuestos por defecto (datos iniciales) ----
const DEFAULT_BUDGETS = [
  // Ypoti
  { id: "b001", name: "Taller Ypoti", establishment: "Ypoti", sector: "Oficina/Taller", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 60_000_000, consumed: 15_000_000, active: true },
  { id: "b002", name: "Veterinária Ypoti", establishment: "Ypoti", sector: "Veterinária", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 120_000_000, consumed: 45_000_000, active: true },
  { id: "b003", name: "Nutrición Ypoti", establishment: "Ypoti", sector: "Confinamento", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 250_000_000, consumed: 80_000_000, active: true },
  { id: "b004", name: "Agricultura Ypoti", establishment: "Ypoti", sector: "Agricultura", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 180_000_000, consumed: 55_000_000, active: true },
  { id: "b005", name: "Manutenção Ypoti", establishment: "Ypoti", sector: "Manutenção", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 40_000_000, consumed: 12_000_000, active: true },
  { id: "b006", name: "Combustible Ypoti", establishment: "Ypoti", sector: "Logística", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 200_000_000, consumed: 78_000_000, active: true },
  { id: "b007", name: "Admin Ypoti", establishment: "Ypoti", sector: "Administrativo", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 30_000_000, consumed: 8_000_000, active: true },

  // Cerro Memby
  { id: "b010", name: "Operacional Cerro Memby", establishment: "Cerro Memby", sector: "Recria", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 80_000_000, consumed: 22_000_000, active: true },
  { id: "b011", name: "Veterinária Cerro Memby", establishment: "Cerro Memby", sector: "Veterinária", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 50_000_000, consumed: 18_000_000, active: true },

  // Cielo Azul
  { id: "b020", name: "Operacional Cielo Azul", establishment: "Cielo Azul", sector: "Recria", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 70_000_000, consumed: 20_000_000, active: true },
  { id: "b021", name: "Veterinária Cielo Azul", establishment: "Cielo Azul", sector: "Veterinária", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 45_000_000, consumed: 15_000_000, active: true },

  // Lusipar
  { id: "b030", name: "Operacional Lusipar", establishment: "Lusipar", sector: "Confinamento", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 150_000_000, consumed: 50_000_000, active: true },
  { id: "b031", name: "Veterinária Lusipar", establishment: "Lusipar", sector: "Veterinária", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 60_000_000, consumed: 20_000_000, active: true },

  // Santa Maria
  { id: "b040", name: "Operacional Santa Maria", establishment: "Santa Maria", sector: "Recria", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 65_000_000, consumed: 18_000_000, active: true },

  // Ybypora
  { id: "b050", name: "Operacional Ybypora", establishment: "Ybypora", sector: "Recria", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 55_000_000, consumed: 15_000_000, active: true },

  // Santa Clara
  { id: "b060", name: "Operacional Santa Clara", establishment: "Santa Clara", sector: "Recria", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 50_000_000, consumed: 12_000_000, active: true },

  // Oro Verde
  { id: "b070", name: "Agricultura Oro Verde", establishment: "Oro Verde", sector: "Agricultura", period: "2026", startDate: "2026-01-01", endDate: "2026-12-31", planned: 90_000_000, consumed: 30_000_000, active: true },
];

// ---- localStorage persistence ----
function loadBudgets() {
  const saved = localStorage.getItem(BUDGETS_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* fall through */ }
  }
  localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(DEFAULT_BUDGETS));
  return [...DEFAULT_BUDGETS];
}

let _budgets = loadBudgets();

export function getBudgets() {
  return _budgets;
}

export function saveBudgets(budgets) {
  _budgets = budgets;
  localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets));
}

export function addBudget(budget) {
  const maxNum = _budgets.reduce((max, b) => {
    const num = parseInt(b.id.replace("b", ""), 10);
    return num > max ? num : max;
  }, 0);
  const newBudget = {
    ...budget,
    id: `b${String(maxNum + 1).padStart(3, "0")}`,
    consumed: budget.consumed || 0,
    active: true,
  };
  _budgets = [..._budgets, newBudget];
  localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(_budgets));
  return newBudget;
}

export function updateBudget(id, updates) {
  _budgets = _budgets.map(b => b.id === id ? { ...b, ...updates } : b);
  localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(_budgets));
}

export function resetBudgetsToDefault() {
  _budgets = [...DEFAULT_BUDGETS];
  localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(_budgets));
  return _budgets;
}

// ---- Query helpers ----

/**
 * Find the best matching budget for a PR
 */
export function findBudgetForPR(establishment, sector) {
  // Try exact match first
  let budget = _budgets.find(b =>
    b.active && b.establishment === establishment && b.sector === sector
  );
  if (budget) return budget;

  // Try establishment-only match (any sector)
  budget = _budgets.find(b =>
    b.active && b.establishment === establishment
  );
  return budget || null;
}

/**
 * Get remaining budget amount
 */
export function getBudgetRemaining(budget) {
  if (!budget) return null;
  return budget.planned - budget.consumed;
}

/**
 * Check if a PR amount would exceed the budget
 */
export function wouldExceedBudget(budget, amount) {
  if (!budget) return false;
  return (budget.consumed + amount) > budget.planned;
}

/**
 * Get budget usage percentage (0-100+)
 */
export function getBudgetPercent(budget) {
  if (!budget || budget.planned === 0) return 0;
  return Math.round((budget.consumed / budget.planned) * 100);
}

/**
 * Consume budget (add to consumed amount)
 */
export function consumeBudget(budgetId, amount) {
  const budget = _budgets.find(b => b.id === budgetId);
  if (budget) {
    updateBudget(budgetId, { consumed: budget.consumed + amount });
  }
}

/**
 * Get budgets by establishment
 */
export function getBudgetsByEstablishment(establishment) {
  return _budgets.filter(b => b.active && b.establishment === establishment);
}

/**
 * Format guaranies
 */
export function formatGuaranies(amount) {
  if (amount == null) return "—";
  return "₲ " + Math.round(amount).toLocaleString("es-PY");
}
