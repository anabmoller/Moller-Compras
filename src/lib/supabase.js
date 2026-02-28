// ============================================================
// YPOTI — Supabase Client + Token Store
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
// and reads can work immediately, without waiting for supabase-js to
// hydrate its internal session (which can be blocked by the init lock).
let _accessToken = null;

export function setStoredToken(token) { _accessToken = token; }
export function getStoredToken() { return _accessToken; }

// ---- Supabase client ----
// `export let` so we can recreate the client after login (to escape a
// hung _initialize lock from a stale session).
export let supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Recreate the supabase client from scratch.
 * Call this after a fetch-based login to get a fresh client with no
 * stale session in its internal state.  The new client's _initialize()
 * will complete instantly (nothing to refresh), so setSession() works.
 */
export function recreateClient() {
  // Derive project ref for localStorage cleanup
  const ref = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
  if (ref) {
    try { localStorage.removeItem(`sb-${ref}-auth-token`); } catch {}
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
}
