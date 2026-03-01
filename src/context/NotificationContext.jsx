/**
 * NotificationContext — in-app notification system
 * Tracks notifications per user, auto-generates on status changes,
 * seeds sample notifications for demo.
 */
import { createContext, useContext, useState, useCallback } from "react";
import { MANAGER_MAP, COMPANY_MAP } from "../constants/approvalConfig";
import { formatGuaranies } from "../constants/budgets";

const NotificationContext = createContext(null);

// Notification type → icon mapping
const TYPE_ICONS = {
  new_request: "🔔",
  authorized: "✅",
  approved: "✅",
  rejected: "❌",
  received: "🚚",
  order: "📋",
  revision: "↩️",
  info: "ℹ️",
};

const TYPE_COLORS = {
  new_request: "#3b82f6",
  authorized: "#22c55e",
  approved: "#22c55e",
  rejected: "#ef4444",
  received: "#f97316",
  order: "#8b5cf6",
  revision: "#f59e0b",
  info: "#64748b",
};

// Generate a unique ID
let _nid = 0;
function genId() { return `notif-${Date.now()}-${++_nid}`; }

// Seed sample notifications for demo
function createSeedNotifications() {
  const now = Date.now();
  return [
    {
      id: genId(),
      type: "new_request",
      message: "Nueva solicitud: MAIZ SECO, BURLANDA — Ypoti — Gs 213.650.000",
      timestamp: now - 3 * 3600000,
      read: false,
      targetUser: "Ana Beatriz Moller",
      targetRole: "admin",
      requestId: "SC-2026-001",
    },
    {
      id: genId(),
      type: "approved",
      message: "Cotización requiere aprobación final: SC-2026-001 — Gs 213.650.000 (>50M)",
      timestamp: now - 2 * 3600000,
      read: false,
      targetUser: "Ana Beatriz Moller",
      targetRole: "admin",
      requestId: "SC-2026-001",
    },
    {
      id: genId(),
      type: "new_request",
      message: "Solicitud pendiente de autorización: CLOSTRISAN — Cerro Memby — Gs 3.200.000",
      timestamp: now - 1 * 3600000,
      read: false,
      targetUser: "Fabiano Ferreira",
      targetRole: "gerente",
      requestId: "SC-2026-002",
    },
    {
      id: genId(),
      type: "authorized",
      message: "Solicitud autorizada lista para cotización: SC-2026-003 COMBUSTIBLE",
      timestamp: now - 5 * 3600000,
      read: true,
      targetUser: "Laura Rivas",
      targetRole: "compras",
      requestId: "SC-2026-003",
    },
    {
      id: genId(),
      type: "approved",
      message: "Solicitud aprobada: SC-2026-003 — Combustible Lusipar",
      timestamp: now - 8 * 3600000,
      read: true,
      targetUser: "Ramon Sosa",
      targetRole: "solicitante",
      requestId: "SC-2026-003",
    },
    {
      id: genId(),
      type: "order",
      message: "Orden de compra generada: SC-2026-005 — UREA Cielo Azul",
      timestamp: now - 12 * 3600000,
      read: true,
      targetUser: "Fabiano Ferreira",
      targetRole: "gerente",
      requestId: "SC-2026-005",
    },
  ];
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => createSeedNotifications());

  const addNotification = useCallback((notif) => {
    setNotifications(prev => [{
      id: genId(),
      timestamp: Date.now(),
      read: false,
      ...notif,
    }, ...prev]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Generate notifications based on status changes
  const notifyStatusChange = useCallback((request, newStatus, extra = {}) => {
    const items = request.items || [];
    const productNames = items.map(i => i.product || i.name || i.nombre).filter(Boolean).join(", ");
    const scNumber = request.id;
    const amount = formatGuaranies(request.totalAmount || 0);
    const establishment = request.establishment;

    switch (newStatus) {
      case "pend_autorizacion": {
        // Notify the gerente for this establishment
        const manager = MANAGER_MAP[establishment] || "Gerente de Área";
        addNotification({
          type: "new_request",
          message: `Nueva solicitud pendiente: ${productNames || request.name} — ${establishment} — ${amount}`,
          targetUser: manager,
          targetRole: "gerente",
          requestId: scNumber,
        });
        break;
      }
      case "autorizado": {
        addNotification({
          type: "authorized",
          message: `Solicitud autorizada lista para cotización: ${scNumber}`,
          targetUser: "Laura Rivas",
          targetRole: "compras",
          requestId: scNumber,
        });
        break;
      }
      case "pend_aprobacion": {
        const info = COMPANY_MAP[establishment] || { director: "Director" };
        addNotification({
          type: "new_request",
          message: `Cotización pendiente de aprobación: ${scNumber} — ${amount}`,
          targetUser: info.director,
          targetRole: "diretoria",
          requestId: scNumber,
        });
        if ((request.totalAmount || 0) > 50_000_000) {
          addNotification({
            type: "new_request",
            message: `Cotización requiere aprobación final: ${scNumber} — ${amount} (>50M)`,
            targetUser: "Ana Moller",
            targetRole: "admin",
            requestId: scNumber,
          });
        }
        break;
      }
      case "aprobado": {
        addNotification({
          type: "approved",
          message: `Solicitud aprobada: ${scNumber}`,
          targetUser: request.requester,
          targetRole: "solicitante",
          requestId: scNumber,
        });
        addNotification({
          type: "approved",
          message: `Solicitud aprobada: ${scNumber}`,
          targetUser: "Laura Rivas",
          targetRole: "compras",
          requestId: scNumber,
        });
        break;
      }
      case "rechazado": {
        addNotification({
          type: "rejected",
          message: `Solicitud rechazada: ${scNumber} — Motivo: ${extra.reason || "Sin motivo"}`,
          targetUser: request.requester,
          targetRole: "solicitante",
          requestId: scNumber,
        });
        break;
      }
      case "recibido": {
        addNotification({
          type: "received",
          message: `Tu pedido fue recibido: ${scNumber}`,
          targetUser: request.requester,
          targetRole: "solicitante",
          requestId: scNumber,
        });
        break;
      }
      case "orden_compra": {
        addNotification({
          type: "order",
          message: `Orden de compra generada: ${scNumber}`,
          targetUser: request.requester,
          targetRole: "solicitante",
          requestId: scNumber,
        });
        break;
      }
      default:
        break;
    }
  }, [addNotification]);

  // Get notifications visible to current user (admin sees all)
  const getVisibleNotifications = useCallback((userName, userRole) => {
    if (userRole === "admin") return notifications;
    return notifications.filter(n =>
      n.targetUser === userName || n.targetRole === userRole
    );
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      notifyStatusChange,
      getVisibleNotifications,
      TYPE_ICONS,
      TYPE_COLORS,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
