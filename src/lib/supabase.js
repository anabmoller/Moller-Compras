import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[YPOTI] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
}

let _accessToken = null;
export function setStoredToken(token) { _accessToken = token; }
export function getStoredToken() { return _accessToken; }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
