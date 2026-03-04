// ============================================================
// YPOTI — AppContext (Edge Functions Backend)
// All writes go through Edge Functions; reads use anon+RLS
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { STATUS_FLOW, SAMPLE_REQUESTS } from "../constants";
import { normalizeStatus } from "../utils/statusHelpers";
import { useAuth } from "./AuthContext";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { getCurrentStep, canUserApproveStep, STEP_STATUS } from "../constants/approvalConfig";
import { initParameters } from "../constants/parameters";
import { initBudgets } from "../constants/budgets";
import { initUsers, hasPermission } from "../constants/users";
import { initGanado } from "../constants/ganado";
import { sanitizeName, sanitizeMultiline, sanitizeNumber } from "../utils/sanitize";
import { useNotifications } from "./NotificationContext";
import {
  fetchAllRequests,
  fetchSingleRequest,
  insertRequest,
  confirmRequestInDb,
  approveStepInDb,
  rejectRequestInDb,
  sendForRevisionInDb,
  advanceStatusInDb,
  updateRequestInDb,
  addCommentInDb,
  addQuotationInDb,
  cancelRequestInDb,
} from "../lib/queries";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const { notifyStatusChange } = useNotifications();

  const [requests, setRequests] = useState([]);
  const [notification, setNotification] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Dev mode override: when active, permission checks use this instead of currentUser
  const [devOverride, setDevOverride] = useState(null);
  const effectiveUser = useMemo(() => devOverride || currentUser, [devOverride, currentUser]);

  const showNotif = useCallback((msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // ---- Initialize all data from Supabase ----
  useEffect(() => {
    if (!currentUser) {
      setDataLoading(false);
      return;
    }

    let mounted = true;

    async function loadAll() {
      if (!supabaseConfigured) {
        console.error("[App] Supabase not configured — skipping data load. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
        if (mounted) {
          showNotif("Error: variables de entorno no configuradas", "error");
          setRequests(SAMPLE_REQUESTS);
        }
        return;
      }

      try {
        // Init reference data + users in parallel
        await Promise.all([
          initParameters(),
          initBudgets(),
          initUsers(),
          initGanado(),
        ]);

        // Load all requests with nested data; fall back to sample data for demo
        const reqs = await fetchAllRequests();
        if (mounted) {
          setRequests(reqs.length > 0 ? reqs : SAMPLE_REQUESTS);
        }
      } catch (err) {
        console.error("[App] Data load failed:", err);
        if (mounted) showNotif("Error cargando datos", "error");
      } finally {
        if (mounted) setDataLoading(false);
      }
    }

    loadAll();

    return () => { mounted = false; };
  }, [currentUser, showNotif]);

  // ---- Realtime: subscribe to requests table changes ----
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("requests-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        async (payload) => {
          try {
            if (payload.eventType === "INSERT") {
              const req = await fetchSingleRequest(payload.new.id);
              if (req) {
                setRequests(prev => {
                  // Avoid duplicates (the creating user already added it)
                  if (prev.some(r => r._uuid === req._uuid)) return prev;
                  return [req, ...prev];
                });
              }
            } else if (payload.eventType === "UPDATE") {
              const req = await fetchSingleRequest(payload.new.id);
              if (req) {
                setRequests(prev => prev.map(r => r._uuid === req._uuid ? req : r));
              }
            } else if (payload.eventType === "DELETE") {
              const oldId = payload.old.id;
              setRequests(prev => prev.filter(r => r._uuid !== oldId));
            }
          } catch (err) {
            console.error("[Realtime] Error handling change:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // ---- Helper: refresh a single request from Supabase ----
  const refreshRequest = useCallback(async (requestUuid) => {
    try {
      const req = await fetchSingleRequest(requestUuid);
      if (req) {
        setRequests(prev => prev.map(r => r._uuid === requestUuid ? req : r));
      }
    } catch (err) {
      console.error("[App] refreshRequest failed:", err);
    }
  }, []);

  // ---- Create new request (status: borrador) ----
  const addRequest = useCallback(async (newReq) => {
    if (!hasPermission(effectiveUser, "create_request")) {
      showNotif("Sin permiso para crear solicitudes", "error");
      return;
    }

    try {
      const sanitized = {
        ...newReq,
        name: sanitizeName(newReq.name),
        requester: sanitizeName(newReq.requester),
        reason: sanitizeMultiline(newReq.reason, 1000),
        purpose: sanitizeMultiline(newReq.purpose, 1000),
        equipment: sanitizeName(newReq.equipment),
        suggestedSupplier: sanitizeName(newReq.suggestedSupplier),
        notes: sanitizeMultiline(newReq.notes, 2000),
        totalAmount: sanitizeNumber(newReq.totalAmount, { min: 0 }),
      };

      // Extract photos before sending to DB
      const photos = sanitized._photos || [];
      delete sanitized._photos;

      // Edge Function derives created_by from JWT — no need to pass currentUser
      const uuid = await insertRequest(sanitized);

      // Upload photos to Supabase storage (non-blocking)
      if (photos.length > 0 && uuid) {
        for (const file of photos) {
          const ext = file.name?.split(".").pop() || "jpg";
          const path = `${uuid}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
          try {
            await supabase.storage.from("attachments").upload(path, file, {
              contentType: file.type,
              upsert: false,
            });
          } catch (uploadErr) {
            console.warn("[App] Photo upload failed:", uploadErr);
          }
        }
      }

      const req = await fetchSingleRequest(uuid);
      if (req) {
        setRequests(prev => [req, ...prev]);
      }
      showNotif("Solicitud creada con éxito");
    } catch (err) {
      console.error("[App] addRequest failed:", err);
      showNotif("Error al crear solicitud", "error");
    }
  }, [showNotif, effectiveUser]);

  // ---- Confirm request → Edge Function calculates steps server-side ----
  const confirmRequest = useCallback(async (reqId) => {
    if (!effectiveUser) return;

    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    if (req.createdBy !== effectiveUser.name && !hasPermission(effectiveUser, "view_all_requests")) return;
    if (req.status !== "borrador") return;

    try {
      // Edge Function handles EVERYTHING server-side:
      // - Finds budget
      // - Calculates approval steps
      // - Updates request status
      // - Inserts steps and history
      await confirmRequestInDb(req._uuid);
      await refreshRequest(req._uuid);
      notifyStatusChange(req, "pend_autorizacion");
      showNotif("Solicitud enviada para aprobación");
    } catch (err) {
      console.error("[App] confirmRequest failed:", err);
      const msg = err?.message || "";
      if (msg.includes("borrador")) {
        showNotif("La solicitud ya fue confirmada o no está en estado borrador", "error");
      } else {
        showNotif("Error al confirmar solicitud", "error");
      }
    }
  }, [effectiveUser, requests, showNotif, refreshRequest, notifyStatusChange]);

  // ---- Approve current step ----
  const approveStep = useCallback(async (reqId, comment = "") => {
    const req = requests.find(r => r.id === reqId);
    if (!req || !req.approvalSteps) return;

    const currentStep = getCurrentStep(req.approvalSteps);
    if (!currentStep) return;
    if (!canUserApproveStep(effectiveUser, currentStep, req.totalAmount)) return;

    // Block approval if quotations exist but no winner selected
    if (req.quotations?.length > 0 && !req.quotations.some(q => q.selected)) {
      showNotif("Debe seleccionar una cotización ganadora antes de aprobar", "error");
      return;
    }

    try {
      // Edge Function verifies approver, updates step, handles budget
      const result = await approveStepInDb(req._uuid, comment);

      // If budget was consumed, refresh budget cache
      if (result?.allApproved && req.budgetId) {
        await initBudgets();
      }

      await refreshRequest(req._uuid);
      if (result?.allApproved) notifyStatusChange(req, "aprobado");
      showNotif("Paso aprobado correctamente", "success");
    } catch (err) {
      console.error("[App] approveStep failed:", err);
      showNotif("Error al aprobar", "error");
    }
  }, [effectiveUser, requests, showNotif, refreshRequest, notifyStatusChange]);

  // ---- Reject request ----
  const rejectRequest = useCallback(async (reqId, reason = "") => {
    if (!hasPermission(effectiveUser, "approve_manager") && !hasPermission(effectiveUser, "approve_purchase")) {
      showNotif("Sin permiso para rechazar solicitudes", "error");
      return;
    }

    const req = requests.find(r => r.id === reqId);
    if (!req || !req.approvalSteps) return;

    const currentStep = getCurrentStep(req.approvalSteps);
    if (!currentStep) return;
    if (!canUserApproveStep(effectiveUser, currentStep, req.totalAmount)) return;

    try {
      // Edge Function verifies approver and handles rejection
      await rejectRequestInDb(req._uuid, sanitizeMultiline(reason, 1000));
      await refreshRequest(req._uuid);
      notifyStatusChange(req, "rechazado", { reason });
      showNotif("Solicitud rechazada", "error");
    } catch (err) {
      console.error("[App] rejectRequest failed:", err);
      showNotif("Error al rechazar", "error");
    }
  }, [effectiveUser, requests, showNotif, refreshRequest, notifyStatusChange]);

  // ---- Send for revision (back to borrador) ----
  const sendForRevision = useCallback(async (reqId, reason = "") => {
    if (!hasPermission(effectiveUser, "approve_manager") && !hasPermission(effectiveUser, "approve_purchase")) {
      showNotif("Sin permiso para devolver solicitudes", "error");
      return;
    }

    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    try {
      // Edge Function handles step reset and status change
      await sendForRevisionInDb(req._uuid, sanitizeMultiline(reason, 1000));
      await refreshRequest(req._uuid);
      showNotif("Devuelto para revisión");
    } catch (err) {
      console.error("[App] sendForRevision failed:", err);
      showNotif("Error al devolver", "error");
    }
  }, [effectiveUser, requests, showNotif, refreshRequest]);

  // ---- Advance status (post-approval flow) ----
  const advanceStatus = useCallback(async (reqId) => {
    if (!hasPermission(effectiveUser, "advance_status")) {
      showNotif("Sin permiso para avanzar el status", "error");
      return;
    }

    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    const normalized = normalizeStatus(req.status);
    const idx = STATUS_FLOW.findIndex(s => s.key === normalized);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;

    try {
      const newStatus = STATUS_FLOW[idx + 1].key;
      await advanceStatusInDb(req._uuid, newStatus);
      await refreshRequest(req._uuid);
      notifyStatusChange(req, newStatus);
      showNotif("Status actualizado");
    } catch (err) {
      console.error("[App] advanceStatus failed:", err);
      showNotif("Error al avanzar status", "error");
    }
  }, [showNotif, effectiveUser, requests, refreshRequest, notifyStatusChange]);

  // ---- Cancel request (requester or super-approver) ----
  const cancelRequest = useCallback(async (reqId, reason = "") => {
    if (!effectiveUser) return;

    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    // Block from terminal statuses
    const blocked = ["recibido", "sap", "cancelado"];
    if (blocked.includes(normalizeStatus(req.status))) {
      showNotif("No se puede cancelar en este estado", "error");
      return;
    }

    try {
      await cancelRequestInDb(req._uuid, reason);
      await refreshRequest(req._uuid);
      notifyStatusChange(req, "cancelado", { reason });
      showNotif("Solicitud cancelada");
    } catch (err) {
      console.error("[App] cancelRequest failed:", err);
      showNotif(err?.message || "Error al cancelar", "error");
    }
  }, [effectiveUser, requests, showNotif, refreshRequest, notifyStatusChange]);

  // ---- Update request (general edits) ----
  const updateRequest = useCallback(async (reqId, updates) => {
    if (!effectiveUser) return;

    const target = requests.find(r => r.id === reqId);
    if (!target) return;

    if (target.createdBy !== effectiveUser.name && !hasPermission(effectiveUser, "view_all_requests")) {
      showNotif("Sin permiso para editar esta solicitud", "error");
      return;
    }

    // Prevent status/workflow manipulation client-side
    const sanitized = { ...updates };
    delete sanitized.status;
    delete sanitized.approvalSteps;
    delete sanitized.approvalHistory;
    delete sanitized.budgetId;
    delete sanitized.budgetExceeded;
    delete sanitized.confirmedAt;
    delete sanitized.approvedAt;
    delete sanitized.rejectedAt;

    // Sanitize text fields
    if (sanitized.notes !== undefined) sanitized.notes = sanitizeMultiline(sanitized.notes, 2000);
    if (sanitized.reason !== undefined) sanitized.reason = sanitizeMultiline(sanitized.reason, 1000);
    if (sanitized.name !== undefined) sanitized.name = sanitizeName(sanitized.name);
    if (sanitized.suggestedSupplier !== undefined) sanitized.suggestedSupplier = sanitizeName(sanitized.suggestedSupplier);

    try {
      // Handle comments — detect new ones and insert individually
      if (Array.isArray(sanitized.comments)) {
        const existingIds = new Set((target.comments || []).map(c => c.id));
        const newComments = sanitized.comments.filter(c => !existingIds.has(c.id));
        for (const c of newComments) {
          // Edge Function derives author from JWT
          await addCommentInDb(target._uuid, sanitizeMultiline(c.texto, 2000));
        }
        delete sanitized.comments;
      }

      // Handle quotations — detect new ones and insert individually
      if (Array.isArray(sanitized.quotations)) {
        const existingIds = new Set((target.quotations || []).map(q => q.id));
        const newQuotations = sanitized.quotations.filter(q => !existingIds.has(q.id));
        for (const q of newQuotations) {
          await addQuotationInDb(target._uuid, q);
        }
        delete sanitized.quotations;
      }

      // Update main request fields
      const fieldsToSkip = ["items", "id", "_uuid", "createdAt", "createdBy", "createdById", "date"];
      const hasDbUpdates = Object.keys(sanitized).some(k => !fieldsToSkip.includes(k));
      if (hasDbUpdates) {
        await updateRequestInDb(target._uuid, sanitized);
      }

      await refreshRequest(target._uuid);
    } catch (err) {
      console.error("[App] updateRequest failed:", err);
      showNotif("Error al actualizar", "error");
    }
  }, [effectiveUser, requests, showNotif, refreshRequest]);

  // ---- Computed values (memoized) ----
  const statusCounts = useMemo(() => {
    const rejectedCount = requests.filter(r => r.status === "rechazado").length;
    return [
      ...STATUS_FLOW.map(s => ({
        ...s,
        count: requests.filter(r => normalizeStatus(r.status) === s.key).length,
      })),
      ...(rejectedCount > 0 ? [{
        key: "rechazado", label: "Rechazado", color: "#e74c3c", icon: "❌",
        count: rejectedCount,
      }] : []),
    ];
  }, [requests]);

  const pendingApprovals = useMemo(() => {
    return requests.filter(r => {
      if (!r.approvalSteps || r.status === "rechazado") return false;
      const step = getCurrentStep(r.approvalSteps);
      return step && effectiveUser && canUserApproveStep(effectiveUser, step, r.totalAmount);
    });
  }, [requests, effectiveUser]);

  return (
    <AppContext.Provider value={{
      requests,
      notification,
      statusCounts,
      pendingApprovals,
      dataLoading,
      showNotif,
      addRequest,
      confirmRequest,
      approveStep,
      rejectRequest,
      sendForRevision,
      advanceStatus,
      cancelRequest,
      updateRequest,
      effectiveUser,
      setDevOverride,
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
