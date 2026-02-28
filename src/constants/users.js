// ============================================================
// YPOTI — ROLES, PERMISOS Y GESTION DE USUARIOS
// ============================================================

import { DEFAULT_USERS } from "./defaultUsers";

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
  gerente: {
    key: "gerente",
    label: "Gerente / Director",
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

// ---- localStorage-backed user list ----
const USERS_STORAGE_KEY = "ypoti_users";

function loadUsers() {
  const saved = localStorage.getItem(USERS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch { /* fall through */ }
  }
  // Seed from defaults on first load
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  return [...DEFAULT_USERS];
}

let _users = loadUsers();

export function getUsers() {
  return _users;
}

export function saveUsers(users) {
  _users = users;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function addUser(user) {
  const maxId = _users.reduce((max, u) => {
    const num = parseInt(u.id.replace("u", ""), 10);
    return num > max ? num : max;
  }, 0);
  const newUser = {
    ...user,
    id: `u${String(maxId + 1).padStart(3, "0")}`,
    active: true,
  };
  _users = [..._users, newUser];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(_users));
  return newUser;
}

export function updateUser(id, updates) {
  _users = _users.map(u => u.id === id ? { ...u, ...updates } : u);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(_users));
}

export function resetUsersToDefault() {
  _users = [...DEFAULT_USERS];
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(_users));
  return _users;
}

// Keep backward compat — USERS is now a getter
export const USERS = _users;

export function hasPermission(user, permission) {
  if (!user) return false;
  const role = ROLES[user.role];
  return role?.permissions.includes(permission) ?? false;
}
