// ============================================================
// YPOTI — ROLES, PERMISOS Y GESTION DE USUARIOS
// Reads via anon client (RLS), writes via direct fetch to Edge Functions
// ============================================================

import { supabase } from "../lib/supabase";
import { invokeEdgeFunction } from "../lib/queries";

// ---- Roles & permissions (unchanged) ----
export const ROLES = {
  admin: {
    key: "admin",
    label: "Administrador",
    description: "Acceso completo al sistema",
    color: "#8b2131",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "manage_quotations", "advance_status",
      "view_analytics", "view_inventory", "manage_settings", "manage_users",
      "view_ganado", "create_movimiento_ganado", "validate_movimiento_ganado",
    ],
  },
  presidente: {
    key: "presidente",
    label: "Presidente",
    description: "Aprobación presidencial y visión completa",
    color: "#7c3aed",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "view_analytics", "view_inventory", "advance_status",
      "view_ganado", "create_movimiento_ganado", "validate_movimiento_ganado",
    ],
  },
  conselho: {
    key: "conselho",
    label: "Consejo",
    description: "Miembro del consejo con poder de aprobación",
    color: "#6d28d9",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "view_analytics", "view_inventory",
      "view_ganado", "create_movimiento_ganado", "validate_movimiento_ganado",
    ],
  },
  socio: {
    key: "socio",
    label: "Socio",
    description: "Socio con poder de aprobación",
    color: "#4c1d95",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "view_analytics", "view_inventory",
      "view_ganado", "create_movimiento_ganado", "validate_movimiento_ganado",
    ],
  },
  super_approver: {
    key: "super_approver",
    label: "Super Aprobador",
    description: "Puede aprobar cualquier solicitud sin límite",
    color: "#dc2626",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "manage_quotations", "advance_status",
      "view_analytics", "view_inventory", "manage_settings",
      "view_ganado", "create_movimiento_ganado", "validate_movimiento_ganado",
    ],
  },
  // Legacy alias — maps to director
  diretoria: {
    key: "diretoria",
    label: "Diretoria",
    description: "Visión completa del sistema, aprobación de alto nivel",
    color: "#1a4731",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "view_analytics", "view_inventory", "advance_status",
      "view_ganado", "create_movimiento_ganado", "validate_movimiento_ganado",
    ],
  },
  director: {
    key: "director",
    label: "Director",
    description: "Visión completa del sistema, aprobación de alto nivel",
    color: "#1a4731",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "view_analytics", "view_inventory", "advance_status",
      "view_ganado", "create_movimiento_ganado", "validate_movimiento_ganado",
    ],
  },
  gerente: {
    key: "gerente",
    label: "Gerente",
    description: "Autorización de solicitudes y visión general",
    color: "#2d5a27",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "view_analytics", "view_inventory", "advance_status",
      "view_ganado", "create_movimiento_ganado", "validate_movimiento_ganado",
    ],
  },
  lider: {
    key: "lider",
    label: "Lider / Supervisor",
    description: "Autorización a nivel de área y seguimiento",
    color: "#2980b9",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "advance_status", "view_inventory",
      "view_ganado", "create_movimiento_ganado",
    ],
  },
  // Legacy alias — maps to compras
  comprador: {
    key: "comprador",
    label: "Compras / Administrativo",
    description: "Gestión de cotizaciones y órdenes de compra",
    color: "#8e44ad",
    permissions: [
      "create_request", "view_all_requests", "manage_quotations",
      "advance_status", "view_inventory",
      "view_ganado",
    ],
  },
  compras: {
    key: "compras",
    label: "Compras",
    description: "Gestión de cotizaciones y órdenes de compra",
    color: "#8e44ad",
    permissions: [
      "create_request", "view_all_requests", "manage_quotations",
      "advance_status", "view_inventory",
      "view_ganado",
    ],
  },
  administrativo: {
    key: "administrativo",
    label: "Administrativo",
    description: "Soporte administrativo y seguimiento",
    color: "#64748b",
    permissions: [
      "create_request", "view_all_requests", "view_inventory",
      "view_ganado",
    ],
  },
  solicitante: {
    key: "solicitante",
    label: "Solicitante",
    description: "Crear y dar seguimiento a solicitudes",
    color: "#6b7280",
    permissions: [
      "create_request", "view_own_requests", "view_inventory",
      "view_ganado",
    ],
  },
  operacional: {
    key: "operacional",
    label: "Operacional",
    description: "Personal operativo con acceso básico",
    color: "#78716c",
    permissions: [
      "create_request", "view_own_requests",
      "view_ganado",
    ],
  },
  observador: {
    key: "observador",
    label: "Observador",
    description: "Acceso de solo lectura al sistema",
    color: "#94a3b8",
    permissions: [
      "view_all_requests", "view_inventory",
      "view_ganado",
    ],
  },
};

// ---- Module-level cache ----
let _users = [];

// ---- Edge Function helper (delegates to shared invokeEdgeFunction) ----
async function invokeAdmin(body) {
  return invokeEdgeFunction("admin-users", body);
}

// ============================================================
// INIT — Load profiles from Supabase (anon + RLS)
// ============================================================

export async function initUsers() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    _users = (data || []).map(p => ({
      id: p.id,                // UUID
      name: p.name,
      email: p.username,       // backward compat: approval engine uses "email" as username
      username: p.username,
      role: p.role,
      establishment: p.establishment,
      position: p.position,
      avatar: p.avatar,
      active: p.active !== false,
      isSuperApprover: p.is_super_approver || false,
      canApprove: p.can_approve || false,
      phone: p.phone || null,
    }));
  } catch (err) {
    console.error("[Users] Init failed:", err);
  }
}

// ============================================================
// SYNCHRONOUS GETTERS
// ============================================================

export function getUsers() {
  return _users;
}

// ============================================================
// ASYNC CRUD — Write via Edge Functions (direct fetch)
// ============================================================

/** Create a new user (auth + profile) */
export async function addUser(user) {
  const data = await invokeAdmin({
    action: "create",
    email: user.email || user.username,
    name: user.name,
    role: user.role || "solicitante",
    establishment: user.establishment || null,
    position: user.position || null,
    avatar: user.avatar || (user.name || "").slice(0, 2).toUpperCase(),
  });

  await initUsers(); // refresh cache
  return _users.find(u => u.id === data.userId);
}

/** Update an existing user's profile */
export async function updateUser(id, updates) {
  await invokeAdmin({ action: "update", userId: id, updates });

  // Update local cache immediately
  _users = _users.map(u => u.id === id ? { ...u, ...updates } : u);
}

/** Reset a user's password to default */
export async function resetPassword(userId) {
  await invokeAdmin({ action: "reset-password", userId });
}

export async function resetUsersToDefault() {
  await initUsers();
  return _users;
}

// ============================================================
// PERMISSION CHECK (unchanged)
// ============================================================

export function hasPermission(user, permission) {
  if (!user) return false;
  const role = ROLES[user.role];
  return role?.permissions.includes(permission) ?? false;
}
