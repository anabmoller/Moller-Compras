// ============================================================
// YPOTI — Auth helpers for Edge Functions
// Extracts caller identity from JWT, loads profile, checks role
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface CallerProfile {
  id: string;
  username: string;
  name: string;
  role: string;
  establishment: string | null;
  active: boolean;
}

/**
 * Create a Supabase admin client (service_role) inside the Edge Function.
 * The SUPABASE_SERVICE_ROLE_KEY is auto-injected by Supabase.
 */
export function createAdminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Extract the JWT from the Authorization header, verify the user,
 * load their profile, and return it.
 */
export async function getCallerProfile(
  req: Request,
  supabaseAdmin: ReturnType<typeof createClient>,
): Promise<CallerProfile> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  const token = authHeader.replace("Bearer ", "");

  // Verify token with Supabase Auth
  const {
    data: { user },
    error: authErr,
  } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) throw new Error("Invalid or expired token");

  // Load profile
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) throw new Error("Profile not found");
  if (!profile.active) throw new Error("User account is inactive");

  return {
    id: profile.id,
    username: profile.username,
    name: profile.name,
    role: profile.role,
    establishment: profile.establishment,
    active: profile.active,
  };
}

/**
 * Assert that the caller has one of the allowed roles.
 * Throws if not authorized.
 */
export function assertRole(
  profile: CallerProfile,
  allowedRoles: string[],
): void {
  if (!allowedRoles.includes(profile.role)) {
    throw new Error(
      `Forbidden: role '${profile.role}' is not in [${allowedRoles.join(", ")}]`,
    );
  }
}

// ---- Permissions (mirrors frontend ROLES) ----
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "create_request", "view_all_requests", "approve_manager",
    "approve_purchase", "manage_quotations", "advance_status",
    "view_analytics", "view_inventory", "manage_settings", "manage_users",
  ],
  diretoria: [
    "create_request", "view_all_requests", "approve_manager",
    "approve_purchase", "view_analytics", "view_inventory", "advance_status",
  ],
  gerente: [
    "create_request", "view_all_requests", "approve_manager",
    "approve_purchase", "view_analytics", "view_inventory", "advance_status",
  ],
  lider: [
    "create_request", "view_all_requests", "approve_manager",
    "advance_status", "view_inventory",
  ],
  comprador: [
    "create_request", "view_all_requests", "manage_quotations",
    "advance_status", "view_inventory",
  ],
  solicitante: [
    "create_request", "view_own_requests", "view_inventory",
  ],
};

export function hasPermission(
  profile: CallerProfile,
  permission: string,
): boolean {
  return ROLE_PERMISSIONS[profile.role]?.includes(permission) ?? false;
}
