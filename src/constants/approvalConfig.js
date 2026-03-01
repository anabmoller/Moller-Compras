// ============================================================
// YPOTI — APPROVAL WORKFLOW CONFIGURATION
// Reglas, mapeos y thresholds del Módulo 9
// ============================================================

import { getParameters } from "./parameters";

// ---- Empresas del Grupo (approval workflow) ----
export const COMPANIES = [
  { id: "rb", name: "Rural Bioenergia S.A.", type: "empresa" },
  { id: "ch", name: "Chacobras S.A.", type: "empresa" },
  { id: "lc", name: "La Constancia", type: "empresa" },
  { id: "cp", name: "Control Pasto S.A.", type: "empresa" },
  { id: "am", name: "Ana Moller", type: "persona_fisica" },
  { id: "gm", name: "Gabriel Moller", type: "persona_fisica" },
  { id: "pm", name: "Pedro Moller", type: "persona_fisica" },
];

// ---- Establecimiento → Empresa mapping ----
export const ESTABLISHMENT_COMPANY = {
  "Ypoti": "Rural Bioenergia S.A.",
  "Cerro Memby": "Chacobras S.A.",
  "Ybypora": "Rural Bioenergia S.A.",
  "Cielo Azul": "Rural Bioenergia S.A.",
  "Santa Clara": "Rural Bioenergia S.A.",
  "Yby Pyta": "Rural Bioenergia S.A.",
  "Lusipar": "Rural Bioenergia S.A.",
  "Santa Maria da Serra": "Rural Bioenergia S.A.",
  "Oro Verde": "Rural Bioenergia S.A.",
  "General": "Rural Bioenergia S.A.",
};

// ---- Gerente de Área por Establecimiento (Step ① — Autorización) ----
export const MANAGER_MAP = {
  "Ypoti": "paulo",
  "Cerro Memby": "fabiano",
  "Ybypora": "fabiano",
  "Cielo Azul": "pedro",
  "Santa Clara": "fabiano",
  "Yby Pyta": "fabiano",
  "Lusipar": "fabiano",
  "Santa Maria da Serra": "pedro",
  "Oro Verde": "paulo",
  "General": "ronei",
};

// ---- Director por Empresa (Step ② — Aprobación Director, ≥ ₲5M) ----
export const COMPANY_MAP = {
  "Rural Bioenergia S.A.": "ronei",
  "Chacobras S.A.": "ronei",
  "La Constancia": "ana.karina",
  "Control Pasto S.A.": "ana",
  "Ana Moller": "ana.moller",
  "Gabriel Moller": "gabriel",
  "Pedro Moller": "pedro.moller",
};

// ---- Presidente por Empresa (Step ③ — Aprobación Presidente, ≥ ₲50M) ----
export const PRESIDENT_MAP = {
  "Rural Bioenergia S.A.": "mauricio",
  "Chacobras S.A.": "ana.karina",
  "La Constancia": "ana.karina",
  "Control Pasto S.A.": "ronei",
};

// ---- Username → Display Name mapping ----
export const USER_DISPLAY_NAMES = {
  "paulo": "Paulo Becker",
  "fabiano": "Fabiano Ferreira",
  "pedro": "Pedro Moller",
  "ronei": "Ronei Ferreira",
  "mauricio": "Mauricio Moller",
  "ana.karina": "Ana Karina",
  "ana": "Ana Moller",
  "ana.moller": "Ana Moller",
  "gabriel": "Gabriel Moller",
  "pedro.moller": "Pedro Moller",
};

// Legacy alias for code that imports MANAGER_BY_ESTABLISHMENT
export const MANAGER_BY_ESTABLISHMENT = MANAGER_MAP;

// Legacy alias for code that imports DIRECTOR_BY_COMPANY
export const DIRECTOR_BY_COMPANY = COMPANY_MAP;

// ---- Overbudget Approver (condicional — R6) ----
export const OVERBUDGET_APPROVER = "ana.moller";

// ---- Veterinaria/Farmacia special approver (R5) ----
export const VET_APPROVER = "rodrigo.ferreira";
export const VET_SECTORS = ["Veterinária", "Farmacia", "Veterinaria"];

// ---- Super-Approvers: can approve any step up to their limit ----
export const SUPER_APPROVERS = {
  "mauricio": Infinity,            // Can approve any amount
  "ronei": 100_000_000_000,       // ₲100B (effectively unlimited)
};

// ---- Thresholds (en Guaraníes ₲) ----
export const THRESHOLDS = {
  DIRECTOR_REQUIRED: 5_000_000,       // ≥ ₲5M → requiere Director
  PRESIDENT_REQUIRED: 50_000_000,    // ≥ ₲50M → requiere Presidente
};

// ---- SLA (en horas) ----
export const SLA = {
  MANAGER_NORMAL: 24,      // 1 día
  MANAGER_EMERGENCY: 4,    // 4 horas
  DIRECTOR_NORMAL: 48,     // 2 días
  DIRECTOR_EMERGENCY: 8,   // 8 horas
  OVERBUDGET: 48,          // 2 días
};

// ---- Approval Step Types ----
export const STEP_TYPES = {
  MANAGER: "manager",
  DIRECTOR: "director",
  OVERBUDGET: "overbudget",
  VET: "vet_specialist",
};

// ---- Step Status ----
export const STEP_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  REVISION: "revision",
  SKIPPED: "skipped",
};

// ============================================================
// APPROVAL ENGINE — Determines steps for a given PR
// ============================================================

/**
 * Given a purchase request, returns an array of approval steps
 * Each step: { type, label, approverUsername, sla, conditional, status }
 *
 * @param {object} pr - The purchase request
 *   pr.establishment - "Ypoti", "Lusipar", etc.
 *   pr.totalAmount   - Total in ₲ (number)
 *   pr.urgency       - "baja"|"media"|"alta"|"emergencia"
 *   pr.sector        - "Veterinária", "Taller", etc.
 *   pr.company       - company id ("rb","ch",...) or null (auto from establishment)
 *   pr.budgetExceeded - boolean, if the PR exceeds the sector budget
 *
 * @param {array} users - All users array (to resolve usernames → names)
 */
export function calculateApprovalSteps(pr, users = []) {
  const steps = [];
  const resolveUser = (username) => users.find(u => u.email === username);
  const displayName = (username) => USER_DISPLAY_NAMES[username] || username;

  const isEmergency = pr.urgency === "emergencia";
  const amount = pr.totalAmount || 0;
  const company = ESTABLISHMENT_COMPANY[pr.establishment] || "Rural Bioenergia S.A.";
  const isVetSector = VET_SECTORS.includes(pr.sector);

  // ---- R5: Veterinaria/Farmacia → Rodrigo first ----
  if (isVetSector) {
    const vetUser = resolveUser(VET_APPROVER);
    steps.push({
      type: STEP_TYPES.VET,
      label: "Especialista Veterinario",
      approverUsername: VET_APPROVER,
      approverName: vetUser?.name || "Rodrigo Ferreira",
      sla: isEmergency ? SLA.MANAGER_EMERGENCY : SLA.MANAGER_NORMAL,
      conditional: false,
      status: STEP_STATUS.PENDING,
      approvedAt: null,
      approvedBy: null,
    });
  }

  // ---- R1/R4: Gerente de Área — AUTORIZACIÓN (siempre presente) ----
  const managerUsername = MANAGER_MAP[pr.establishment] || "ronei";
  const managerUser = resolveUser(managerUsername);
  steps.push({
    type: STEP_TYPES.MANAGER,
    label: "Autorización — Gerente de Área",
    approverUsername: managerUsername,
    approverName: managerUser?.name || displayName(managerUsername),
    sla: isEmergency ? SLA.MANAGER_EMERGENCY : SLA.MANAGER_NORMAL,
    conditional: false,
    status: STEP_STATUS.PENDING,
    approvedAt: null,
    approvedBy: null,
  });

  // ---- R2: Director si valor ≥ ₲5M ----
  if (amount >= THRESHOLDS.DIRECTOR_REQUIRED) {
    const directorUsername = COMPANY_MAP[company] || "ronei";
    const directorUser = resolveUser(directorUsername);
    steps.push({
      type: STEP_TYPES.DIRECTOR,
      label: "Aprobación — Director",
      approverUsername: directorUsername,
      approverName: directorUser?.name || displayName(directorUsername),
      sla: isEmergency ? SLA.DIRECTOR_EMERGENCY : SLA.DIRECTOR_NORMAL,
      conditional: false,
      status: STEP_STATUS.PENDING,
      approvedAt: null,
      approvedBy: null,
    });
  }

  // ---- R3: Presidente si valor ≥ ₲50M ----
  if (amount >= THRESHOLDS.PRESIDENT_REQUIRED) {
    const presidentUsername = PRESIDENT_MAP[company];
    if (presidentUsername) {
      const presUser = resolveUser(presidentUsername);
      steps.push({
        type: STEP_TYPES.OVERBUDGET,
        label: "Aprobación — Presidente",
        approverUsername: presidentUsername,
        approverName: presUser?.name || displayName(presidentUsername),
        sla: SLA.OVERBUDGET,
        conditional: false,
        status: STEP_STATUS.PENDING,
        approvedAt: null,
        approvedBy: null,
      });
    }
  }

  // ---- R6: Budget exceeded → extra overbudget step ----
  if (pr.budgetExceeded && amount < THRESHOLDS.PRESIDENT_REQUIRED) {
    const obUser = resolveUser(OVERBUDGET_APPROVER);
    steps.push({
      type: STEP_TYPES.OVERBUDGET,
      label: "Aprobación Overbudget",
      approverUsername: OVERBUDGET_APPROVER,
      approverName: obUser?.name || displayName(OVERBUDGET_APPROVER),
      sla: SLA.OVERBUDGET,
      conditional: true,
      status: STEP_STATUS.PENDING,
      approvedAt: null,
      approvedBy: null,
    });
  }

  return steps;
}

/**
 * Check if a user can approve a specific step
 * Super-approvers can approve any step within their amount limit
 */
export function canUserApproveStep(user, step, requestAmount = 0) {
  if (!user || !step) return false;
  if (user.email === step.approverUsername) return true;
  // Super-approver check
  const superLimit = SUPER_APPROVERS[user.email];
  if (superLimit !== undefined && requestAmount <= superLimit) return true;
  return false;
}

/**
 * Get the current pending step (first non-approved step)
 */
export function getCurrentStep(steps) {
  if (!steps || steps.length === 0) return null;
  return steps.find(s => s.status === STEP_STATUS.PENDING) || null;
}

/**
 * Check if all steps are approved
 */
export function isFullyApproved(steps) {
  if (!steps || steps.length === 0) return false;
  return steps.every(s => s.status === STEP_STATUS.APPROVED || s.status === STEP_STATUS.SKIPPED);
}

/**
 * Get SLA deadline from a step's start time
 */
export function getStepDeadline(step, startedAt) {
  if (!startedAt || !step) return null;
  const start = new Date(startedAt);
  return new Date(start.getTime() + step.sla * 60 * 60 * 1000);
}

/**
 * Check if a step is overdue
 */
export function isStepOverdue(step, startedAt) {
  const deadline = getStepDeadline(step, startedAt);
  if (!deadline) return false;
  return new Date() > deadline;
}
