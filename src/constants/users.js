// ============================================================
// YPOTI — ROLES, PERMISOS Y GESTION DE USUARIOS
// Reads via anon client (RLS), writes via direct fetch to Edge Functions
// ============================================================

import { supabase, supabaseUrl, supabaseAnonKey, getStoredToken } from "../lib/supabase";

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
    description: "Visión completa del sistema, aprobación de alto nivel",
    color: "#1a4731",
    permissions: [
      "create_request", "view_all_requests", "approve_manager",
      "approve_purchase", "view_analytics", "view_inventory", "advance_status",
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

// ---- Edge Function helper (same pattern as queries.js) ----
async function invokeAdmin(body) {
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

  if (!token) {
    throw new Error("No hay sesión activa. Por favor, inicia sesión de nuevo.");
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/admin-users`, {
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
