// ============================================================
// YPOTI — Approval Engine (Edge Function port)
// Port of src/constants/approvalConfig.js → TypeScript
// Server-side approval step calculation — never trust client
// ============================================================

// ---- Establecimiento → Empresa default mapping ----
export const ESTABLISHMENT_COMPANY: Record<string, string> = {
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

// ---- Gerente de Area por Establecimiento (Step 1) ----
export const MANAGER_BY_ESTABLISHMENT: Record<string, string> = {
  "Ypoti": "paulo",
  "Cerro Memby": "fabiano",
  "Ybypora": "fabiano",
  "Cielo Azul": "mauricio",
  "Santa Clara": "mauricio",
  "Yby Pyta": "mauricio",
  "Lusipar": "ronei",
  "Santa Maria": "ronei",
  "Oro Verde": "ronei",
  "General": "fabiano",
};

// ---- Director por Empresa (Step 2) ----
export const DIRECTOR_BY_COMPANY: Record<string, string> = {
  "rb": "paulo",
  "ch": "gabriel",
  "lc": "pedro.moller",
  "cp": "gabriel",
  "am": "ana.moller",
  "gm": "gabriel",
  "pm": "pedro.moller",
};

// ---- Overbudget Approver (Step 3 condicional) ----
export const OVERBUDGET_APPROVER = "ana.moller";

// ---- Veterinaria/Farmacia special approver (R5) ----
export const VET_APPROVER = "rodrigo.ferreira";
export const VET_SECTORS = ["Veterinária", "Farmacia", "Veterinaria"];

// ---- Thresholds (en Guaranies) ----
export const THRESHOLDS = {
  DIRECTOR_REQUIRED: 5_000_000,
  OVERBUDGET_DIRECTOR: 50_000_000,
};

// ---- SLA (en horas) ----
export const SLA = {
  MANAGER_NORMAL: 24,
  MANAGER_EMERGENCY: 4,
  DIRECTOR_NORMAL: 48,
  DIRECTOR_EMERGENCY: 8,
  OVERBUDGET: 48,
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

// ---- Types ----
export interface ApprovalStep {
  type: string;
  label: string;
  approverUsername: string;
  approverName: string;
  sla: number;
  conditional: boolean;
  status: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

interface PurchaseRequest {
  establishment: string;
  totalAmount: number;
  urgency: string;
  sector: string;
  company: string | null;
  budgetExceeded: boolean;
}

interface User {
  email: string;  // actually "username" in profiles
  name: string;
}

// ============================================================
// APPROVAL ENGINE — Determines steps for a given PR
// ============================================================

export function calculateApprovalSteps(
  pr: PurchaseRequest,
  users: User[],
  // Dynamic params from admin tables (optional)
  dynamicParams?: {
    establishments?: Array<{ name: string; company?: string; manager?: string }>;
    companies?: Array<{ name: string; director?: string }>;
  },
): ApprovalStep[] {
  const steps: ApprovalStep[] = [];
  const resolveUser = (username: string) =>
    users.find((u) => u.email === username);

  // Dynamic resolution from admin parameters (with hardcoded fallback)
  const paramEstab = dynamicParams?.establishments?.find(
    (e) => e.name === pr.establishment,
  );
  const paramCompany = dynamicParams?.companies?.find(
    (c) => c.name === paramEstab?.company,
  );

  const isEmergency = pr.urgency === "emergencia";
  const amount = pr.totalAmount || 0;
  const companyId =
    pr.company || ESTABLISHMENT_COMPANY[pr.establishment] || "rb";
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

  // ---- R1/R4: Gerente de Area — AUTORIZACIÓN (siempre presente) ----
  const dynamicManager = paramEstab?.manager?.toLowerCase();
  const managerUsername =
    dynamicManager || MANAGER_BY_ESTABLISHMENT[pr.establishment] || "fabiano";
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

  // ---- R2: Director si valor >= 5M ----
  if (amount >= THRESHOLDS.DIRECTOR_REQUIRED) {
    const dynamicDirector = paramCompany?.director?.toLowerCase();
    const directorUsername =
      dynamicDirector || DIRECTOR_BY_COMPANY[companyId] || "paulo";
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

  // ---- R3: Overbudget (>=50M) OR R6: budget excedido ----
  if (amount >= THRESHOLDS.OVERBUDGET_DIRECTOR || pr.budgetExceeded) {
    const obUser = resolveUser(OVERBUDGET_APPROVER);
    steps.push({
      type: STEP_TYPES.OVERBUDGET,
      label: "Aprobación Overbudget",
      approverUsername: OVERBUDGET_APPROVER,
      approverName: obUser?.name || "Ana Moller",
      sla: SLA.OVERBUDGET,
      conditional: true,
      status: STEP_STATUS.PENDING,
      approvedAt: null,
      approvedBy: null,
    });
  }

  return steps;
}

/** Get the current pending step (first non-approved step) */
export function getCurrentStep(
  steps: Array<{ status: string }>,
): (typeof steps)[number] | null {
  if (!steps || steps.length === 0) return null;
  return steps.find((s) => s.status === STEP_STATUS.PENDING) || null;
}

/** Check if all steps are approved */
export function isFullyApproved(
  steps: Array<{ status: string }>,
): boolean {
  if (!steps || steps.length === 0) return false;
  return steps.every(
    (s) =>
      s.status === STEP_STATUS.APPROVED || s.status === STEP_STATUS.SKIPPED,
  );
}
