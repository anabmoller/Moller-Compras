// ============================================================
// YPOTI — APPROVAL WORKFLOW CONFIGURATION
// Reglas, mapeos y thresholds del Módulo 9
// ============================================================

import { getParameters } from "./parameters";

// ---- Empresas del Grupo (approval workflow) ----
// NOTE: The full company list with RUC/activity is in constants/index.js.
// This shorter list uses IDs referenced by ESTABLISHMENT_COMPANY and
// DIRECTOR_BY_COMPANY throughout the approval engine.
export const COMPANIES = [
  { id: "rb", name: "Rural Bioenergia S.A.", type: "empresa" },
  { id: "ch", name: "Chacobras S.A.", type: "empresa" },
  { id: "lc", name: "La Constancia S.A.", type: "empresa" },
  { id: "cp", name: "Control Pasto S.A.", type: "empresa" },
  { id: "am", name: "Ana Moller", type: "persona_fisica" },
  { id: "gm", name: "Gabriel Moller", type: "persona_fisica" },
  { id: "pm", name: "Pedro Moller", type: "persona_fisica" },
];

// ---- Establecimiento → Empresa default mapping ----
export const ESTABLISHMENT_COMPANY = {
  "Ypoti": "rb",
  "Cerro Memby": "rb",
  "Cielo Azul": "rb",
  "Lusipar": "rb",
  "Santa Maria": "rb",
  "Ybypora": "rb",
  "Santa Clara": "lc",
  "Yby Pyta": "rb",
  "Oro Verde": "rb",
  "General": "rb",
};

// ---- Gerente de Área por Establecimiento (Step ①) ----
// username → matches user.username in profiles table
export const MANAGER_BY_ESTABLISHMENT = {
  "Ypoti":        "paulo",
  "Cerro Memby":  "fabiano",
  "Ybypora":      "fabiano",
  "Cielo Azul":   "mauricio",
  "Santa Clara":  "mauricio",
  "Yby Pyta":     "mauricio",
  "Lusipar":      "ronei",
  "Santa Maria":  "ronei",
  "Oro Verde":    "ronei",
  "General":      "fabiano",  // default: Fabiano as general manager
};

// ---- Director por Empresa (Step ②) ----
export const DIRECTOR_BY_COMPANY = {
  "rb": "paulo",           // Paulo → Rural Bioenergia
  "ch": "gabriel",         // Gabriel → Chacobras
  "lc": "pedro.moller",   // Pedro Moller → La Constancia
  "cp": "gabriel",         // Gabriel → Control Pasto
  "am": "ana.moller",     // Ana Moller → PF Ana Moller
  "gm": "gabriel",         // Gabriel → PF Gabriel
  "pm": "pedro.moller",   // Pedro → PF Pedro
};

// ---- Overbudget Approver (Step ③ condicional) ----
export const OVERBUDGET_APPROVER = "ana.moller";

// ---- Veterinaria/Farmacia special approver (R5) ----
export const VET_APPROVER = "rodrigo.ferreira";
export const VET_SECTORS = ["Veterinária", "Farmacia", "Veterinaria"];

// ---- Thresholds (en Guaraníes ₲) ----
export const THRESHOLDS = {
  DIRECTOR_REQUIRED: 5_000_000,       // ≥ ₲5M → requiere Director
  OVERBUDGET_DIRECTOR: 50_000_000,    // ≥ ₲50M → requiere Ana Moller
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

  // Dynamic resolution from admin parameters (with hardcoded fallback)
  const params = getParameters();
  const paramEstab = params.establishments?.find(e => e.name === pr.establishment);
  const paramCompany = params.companies?.find(c => c.name === paramEstab?.company);

  const isEmergency = pr.urgency === "emergencia";
  const amount = pr.totalAmount || 0;
  const companyId = pr.company || ESTABLISHMENT_COMPANY[pr.establishment] || "rb";
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
  // Try dynamic lookup from admin parameters, fall back to hardcoded map
  const dynamicManager = paramEstab?.manager?.toLowerCase();
  const managerUsername = dynamicManager || MANAGER_BY_ESTABLISHMENT[pr.establishment] || "fabiano";
  const managerUser = resolveUser(managerUsername);
  steps.push({
    type: STEP_TYPES.MANAGER,
    label: "Autorización — Gerente de Área",
    approverUsername: managerUsername,
    approverName: managerUser?.name || managerUsername,
    sla: isEmergency ? SLA.MANAGER_EMERGENCY : SLA.MANAGER_NORMAL,
    conditional: false,
    status: STEP_STATUS.PENDING,
    approvedAt: null,
    approvedBy: null,
  });

  // ---- R2: Director si valor ≥ ₲5M ----
  if (amount >= THRESHOLDS.DIRECTOR_REQUIRED) {
    // Try dynamic lookup from admin parameters, fall back to hardcoded map
    const dynamicDirector = paramCompany?.director?.toLowerCase();
    const directorUsername = dynamicDirector || DIRECTOR_BY_COMPANY[companyId] || "paulo";
    const directorUser = resolveUser(directorUsername);
    steps.push({
      type: STEP_TYPES.DIRECTOR,
      label: "Aprobación — Director / CFO",
      approverUsername: directorUsername,
      approverName: directorUser?.name || directorUsername,
      sla: isEmergency ? SLA.DIRECTOR_EMERGENCY : SLA.DIRECTOR_NORMAL,
      conditional: false,
      status: STEP_STATUS.PENDING,
      approvedAt: null,
      approvedBy: null,
    });
  }

  // ---- R3: Overbudget (≥₲50M) OR R6: budget excedido ----
  if (amount >= THRESHOLDS.OVERBUDGET_DIRECTOR || pr.budgetExceeded) {
    const obUser = resolveUser(OVERBUDGET_APPROVER);
    steps.push({
      type: STEP_TYPES.OVERBUDGET,
      label: "Aprobación Overbudget",
      approverUsername: OVERBUDGET_APPROVER,
      approverName: obUser?.name || "Ana Moller",
      sla: SLA.OVERBUDGET,
      conditional: true,  // only shows when triggered
      status: STEP_STATUS.PENDING,
      approvedAt: null,
      approvedBy: null,
    });
  }

  return steps;
}

/**
 * Check if a user can approve a specific step
 */
export function canUserApproveStep(user, step) {
  if (!user || !step) return false;
  return user.email === step.approverUsername;
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
