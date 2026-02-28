// ============================================================
// YPOTI — Supabase Client + Token Store
// CRITICAL: Only ONE createClient() call in the entire app.
// Edge Functions use _accessToken via direct fetch (not supabase-js).
// ============================================================

import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[YPOTI] Missing Supabase environment variables. " +
    "Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env"
  );
}

// ---- Token store ----
// The fetch-based login stores the JWT here so that Edge Function calls
// can work immediately via direct fetch. This is the SINGLE SOURCE OF TRUTH
// for the access token used in all Edge Function calls.
let _accessToken = null;

export function setStoredToken(token) {
  _accessToken = token;
}
export function getStoredToken() { return _accessToken; }

// ---- Supabase client (SINGLE INSTANCE) ----
// Clear any stale auth token from localStorage BEFORE creating the client
// so _initialize() finds nothing to refresh and completes instantly.
// This eliminates "orphaned lock not released within 5000ms" warnings
// and prevents the _initialize() lock from blocking setSession() later.
const _ref = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
if (_ref) { try { localStorage.removeItem(`sb-${_ref}-auth-token`); } catch {} }

// SINGLE client — never recreated. This prevents "Multiple GoTrueClient
// instances" warning and ensures one consistent auth state.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
