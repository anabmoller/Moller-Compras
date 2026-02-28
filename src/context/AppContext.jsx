import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { STATUS_FLOW, SAMPLE_REQUESTS } from "../constants";
import { useAuth } from "./AuthContext";
import { calculateApprovalSteps, getCurrentStep, isFullyApproved, STEP_STATUS } from "../constants/approvalConfig";
import { findBudgetForPR, wouldExceedBudget, consumeBudget } from "../constants/budgets";
import { getUsers } from "../constants/users";

const AppContext = createContext(null);

import { STORAGE_KEYS } from "../constants/storageKeys";

export function AppProvider({ children }) {
  const { currentUser } = useAuth();

  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (saved) {
      try { return JSON.parse(saved); }
      catch { return SAMPLE_REQUESTS; }
    }
    return SAMPLE_REQUESTS;
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  }, [requests]);

  const showNotif = useCallback((msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // ---- Create new request (status: borrador) ----
  const addRequest = useCallback((newReq) => {
    const id = `SC-2026-${String(requests.length + 1).padStart(3, "0")}`;
    setRequests(prev => [{
      ...newReq,
      id,
      date: new Date().toISOString().slice(0, 10),
      status: "borrador",
      createdBy: currentUser?.name || "Unknown",
      approvalSteps: null,
      approvalHistory: [],
      totalAmount: newReq.totalAmount || 0,
      company: newReq.company || null,
      sector: newReq.sector || null,
      priority: (newReq.urgency || newReq.priority || "media").toLowerCase(),
      budgetId: null,
      budgetExceeded: false,
    }, ...prev]);
    showNotif("Solicitud creada con éxito");
  }, [requests.length, showNotif, currentUser]);

  // ---- Confirm request → calculate approval steps and move to pending ----
  const confirmRequest = useCallback((reqId) => {
    const users = getUsers();
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId) return r;
      if (r.status !== "borrador") return r;

      // Find matching budget
      const budget = findBudgetForPR(r.establishment, r.sector);
      const exceeds = budget ? wouldExceedBudget(budget, r.totalAmount || 0) : false;

      // Calculate approval steps
      const steps = calculateApprovalSteps({
        establishment: r.establishment,
        totalAmount: r.totalAmount || 0,
        urgency: (r.urgency || r.priority || "media").toLowerCase(),
        sector: r.sector || "",
        company: r.company || null,
        budgetExceeded: exceeds,
      }, users);

      return {
        ...r,
        status: "pendiente_aprobacion",
        approvalSteps: steps,
        approvalHistory: [
          ...(r.approvalHistory || []),
          {
            action: "confirmed",
            by: currentUser?.name || "Unknown",
            at: new Date().toISOString(),
            note: "Solicitud confirmada y enviada para aprobación",
          },
        ],
        budgetId: budget?.id || null,
        budgetExceeded: exceeds,
        confirmedAt: new Date().toISOString(),
      };
    }));
    showNotif("Solicitud enviada para aprobación");
  }, [currentUser, showNotif]);

  // ---- Approve current step ----
  const approveStep = useCallback((reqId, comment = "") => {
    const now = new Date().toISOString();
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId || !r.approvalSteps) return r;

      const currentStep = getCurrentStep(r.approvalSteps);
      if (!currentStep) return r;

      // Check if current user can approve this step
      if (currentUser?.email !== currentStep.approverUsername) return r;

      // Mark current step as approved
      const updatedSteps = r.approvalSteps.map(s =>
        s === currentStep
          ? { ...s, status: STEP_STATUS.APPROVED, approvedAt: now, approvedBy: currentUser.name }
          : s
      );

      // Check if all steps are now approved
      const allApproved = isFullyApproved(updatedSteps);

      // Build history entry
      const historyEntry = {
        action: "approved",
        step: currentStep.label,
        by: currentUser.name,
        at: now,
        note: comment || `Aprobado por ${currentUser.name}`,
      };

      // If fully approved, consume budget and advance status
      if (allApproved && r.budgetId) {
        consumeBudget(r.budgetId, r.totalAmount || 0);
      }

      return {
        ...r,
        approvalSteps: updatedSteps,
        status: allApproved ? "aprobado" : r.status,
        approvalHistory: [...(r.approvalHistory || []), historyEntry],
        ...(allApproved ? { approvedAt: now } : {}),
      };
    }));
    showNotif("Paso aprobado correctamente", "success");
  }, [currentUser, showNotif]);

  // ---- Reject request ----
  const rejectRequest = useCallback((reqId, reason = "") => {
    const now = new Date().toISOString();
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId || !r.approvalSteps) return r;

      const currentStep = getCurrentStep(r.approvalSteps);
      if (!currentStep) return r;
      if (currentUser?.email !== currentStep.approverUsername) return r;

      const updatedSteps = r.approvalSteps.map(s =>
        s === currentStep
          ? { ...s, status: STEP_STATUS.REJECTED, approvedAt: now, approvedBy: currentUser.name }
          : s
      );

      return {
        ...r,
        approvalSteps: updatedSteps,
        status: "rechazado",
        approvalHistory: [...(r.approvalHistory || []), {
          action: "rejected",
          step: currentStep.label,
          by: currentUser.name,
          at: now,
          note: reason || `Rechazado por ${currentUser.name}`,
        }],
        rejectedAt: now,
      };
    }));
    showNotif("Solicitud rechazada", "error");
  }, [currentUser, showNotif]);

  // ---- Send for revision (back to borrador) ----
  const sendForRevision = useCallback((reqId, reason = "") => {
    const now = new Date().toISOString();
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId) return r;

      // Reset all approval steps to pending
      const resetSteps = r.approvalSteps
        ? r.approvalSteps.map(s => ({ ...s, status: STEP_STATUS.PENDING, approvedAt: null, approvedBy: null }))
        : null;

      return {
        ...r,
        approvalSteps: resetSteps,
        status: "borrador",
        approvalHistory: [...(r.approvalHistory || []), {
          action: "revision",
          by: currentUser?.name || "Unknown",
          at: now,
          note: reason || "Devuelto para revisión",
        }],
      };
    }));
    showNotif("Devuelto para revisión");
  }, [currentUser, showNotif]);

  // ---- Legacy advance status (for post-approval flow) ----
  const advanceStatus = useCallback((reqId) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId) return r;
      const idx = STATUS_FLOW.findIndex(s => s.key === r.status);
      if (idx < STATUS_FLOW.length - 1) {
        return {
          ...r,
          status: STATUS_FLOW[idx + 1].key,
          approvalHistory: [...(r.approvalHistory || []), {
            action: "advanced",
            by: currentUser?.name || "Unknown",
            at: new Date().toISOString(),
            note: `Avanzado a ${STATUS_FLOW[idx + 1].label}`,
          }],
        };
      }
      return r;
    }));
    showNotif("Status actualizado");
  }, [showNotif, currentUser]);

  const updateRequest = useCallback((reqId, updates) => {
    setRequests(prev => prev.map(r =>
      r.id === reqId ? { ...r, ...updates } : r
    ));
  }, []);

  const rejectedCount = requests.filter(r => r.status === "rechazado").length;
  const statusCounts = [
    ...STATUS_FLOW.map(s => ({
      ...s,
      count: requests.filter(r => r.status === s.key).length,
    })),
    ...(rejectedCount > 0 ? [{
      key: "rechazado", label: "Rechazado", color: "#e74c3c", icon: "❌",
      count: rejectedCount,
    }] : []),
  ];

  // Count pending approvals for current user
  const pendingApprovals = requests.filter(r => {
    if (!r.approvalSteps || r.status === "rechazado") return false;
    const step = getCurrentStep(r.approvalSteps);
    return step && currentUser && step.approverUsername === currentUser.email;
  });

  return (
    <AppContext.Provider value={{
      requests,
      notification,
      statusCounts,
      pendingApprovals,
      showNotif,
      addRequest,
      confirmRequest,
      approveStep,
      rejectRequest,
      sendForRevision,
      advanceStatus,
      updateRequest,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
