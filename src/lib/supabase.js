import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Flag for downstream code to check before making queries
export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  console.error(
    "[YPOTI] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env — " +
    "the app will show a configuration error. Set these in Vercel Environment Variables."
  );
}

let _accessToken = null;
export function setStoredToken(token) { _accessToken = token; }
export function getStoredToken() { return _accessToken; }

// Guard: createClient throws TypeError when URL/key are undefined.
// Use a placeholder to avoid a module-level crash; all queries will fail
// gracefully and the UI will show a config-missing message.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
