// ============================================================
// YPOTI — ROLES, PERMISOS Y GESTION DE USUARIOS
// Reads via anon client (RLS), writes via Edge Functions
// ============================================================

import { supabase } from "../lib/supabase";

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
    ],
  },
  diretoria: {
    key: "diretoria",
    label: "Diretoria",
    description: "Vision completa del sistema, aprobacion de alto nivel",
    color: "#1a4731",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "view_analytics", "view_inventory", "advance_status",
    ],
  },
  gerente: {
    key: "gerente",
    label: "Gerente",
    description: "Aprobacion de solicitudes y vision general",
    color: "#2d5a27",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "view_analytics", "view_inventory", "advance_status",
    ],
  },
  lider: {
    key: "lider",
    label: "Lider / Supervisor",
    description: "Aprobacion a nivel de area y seguimiento",
    color: "#2980b9",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "advance_status", "view_inventory",
    ],
  },
  comprador: {
    key: "comprador",
    label: "Compras / Administrativo",
    description: "Gestion de cotizaciones y ordenes de compra",
    color: "#8e44ad",
    permissions: [
      "create_request", "view_all_requests", "manage_quotations",
      "advance_status", "view_inventory",
    ],
  },
  solicitante: {
    key: "solicitante",
    label: "Solicitante",
    description: "Crear y dar seguimiento a solicitudes",
    color: "#6b7280",
    permissions: [
      "create_request", "view_own_requests", "view_inventory",
    ],
  },
};

// ---- Module-level cache ----
let _users = [];

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
    }));

    console.log("[Users] Initialized from Supabase:", _users.length, "users");
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
// ASYNC CRUD — Write via Edge Functions
// ============================================================

/** Create a new user (auth + profile) */
export async function addUser(user) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: {
      action: "create",
      email: user.email || user.username,
      name: user.name,
      role: user.role || "solicitante",
      establishment: user.establishment || null,
      position: user.position || null,
      avatar: user.avatar || (user.name || "").slice(0, 2).toUpperCase(),
    },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  await initUsers(); // refresh cache
  return _users.find(u => u.id === data.userId);
}

/** Update an existing user's profile */
export async function updateUser(id, updates) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action: "update", userId: id, updates },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  // Update local cache immediately
  _users = _users.map(u => u.id === id ? { ...u, ...updates } : u);
}

/** Reset a user's password to default */
export async function resetPassword(userId) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action: "reset-password", userId },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

export async function resetUsersToDefault() {
  console.warn("[Users] resetUsersToDefault is not available in Supabase mode");
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
