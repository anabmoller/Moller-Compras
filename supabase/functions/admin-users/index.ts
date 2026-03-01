// ============================================================
// YPOTI — Edge Function: admin-users
// Actions: create, update, reset-password
// Authorization: Admin only
// ============================================================

import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient, getCallerProfile, assertRole } from "../_shared/auth.ts";
import { sanitizeName, sanitizeEmail } from "../_shared/sanitize.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const caller = await getCallerProfile(req, supabaseAdmin);
    assertRole(caller, ["admin"]);

    const { action, ...payload } = await req.json();

    switch (action) {
      // ─────────────────────────────────────────────────
      // CREATE USER (auth + profile)
      // ─────────────────────────────────────────────────
      case "create": {
        const username = sanitizeEmail(payload.email || payload.username);
        if (!username) throw new Error("Email/username is required");

        const authEmail = username.includes("@")
          ? username
          : `${username}@ypoti.local`;

        // Create Supabase auth user
        const defaultPassword = Deno.env.get("DEFAULT_USER_PASSWORD");
        if (!defaultPassword) {
          throw new Error("DEFAULT_USER_PASSWORD not configured");
        }
        const { data: authData, error: authErr } =
          await supabaseAdmin.auth.admin.createUser({
            email: authEmail,
            password: defaultPassword,
            email_confirm: true,
          });
        if (authErr) throw authErr;

        // Create profile
        const cleanUsername = authEmail.split("@")[0];
        const { error: profileErr } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: authData.user.id,
            username: cleanUsername,
            email: authEmail,
            name: sanitizeName(payload.name) || cleanUsername,
            role: payload.role || "solicitante",
            establishment: payload.establishment || null,
            position: payload.position || null,
            avatar:
              payload.avatar ||
              (payload.name || "").slice(0, 2).toUpperCase(),
            active: true,
            force_password_change: true,
          });
        if (profileErr) throw profileErr;

        return new Response(
          JSON.stringify({ ok: true, userId: authData.user.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // ─────────────────────────────────────────────────
      // UPDATE USER (profile only)
      // ─────────────────────────────────────────────────
      case "update": {
        const { userId, updates } = payload;
        if (!userId) throw new Error("userId is required");

        const row: Record<string, unknown> = {};
        if (updates.name !== undefined) row.name = sanitizeName(updates.name);
        if (updates.role !== undefined) row.role = updates.role;
        if (updates.establishment !== undefined)
          row.establishment = updates.establishment;
        if (updates.position !== undefined) row.position = updates.position;
        if (updates.avatar !== undefined) row.avatar = updates.avatar;
        if (updates.active !== undefined) row.active = updates.active;

        if (Object.keys(row).length === 0) {
          return new Response(
            JSON.stringify({ ok: true, message: "No changes" }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update(row)
          .eq("id", userId);
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // RESET PASSWORD
      // ─────────────────────────────────────────────────
      case "reset-password": {
        const { userId: uid } = payload;
        if (!uid) throw new Error("userId is required");

        const resetPassword = Deno.env.get("DEFAULT_USER_PASSWORD");
        if (!resetPassword) {
          throw new Error("DEFAULT_USER_PASSWORD not configured");
        }
        const { error: pwErr } =
          await supabaseAdmin.auth.admin.updateUserById(uid, {
            password: resetPassword,
          });
        if (pwErr) throw pwErr;

        // Set force_password_change flag
        await supabaseAdmin
          .from("profiles")
          .update({ force_password_change: true })
          .eq("id", uid);

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[admin-users]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
