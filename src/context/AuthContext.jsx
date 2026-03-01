import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase, supabaseUrl, supabaseAnonKey, setStoredToken, getStoredToken } from "../lib/supabase";
import {
  hasPermission, getUsers, initUsers,
  addUser as addUserToDb, updateUser as updateUserInDb,
  resetPassword as resetPasswordInDb,
} from "../constants/users";

// ============================================================
// YPOTI — AuthContext (Supabase Auth)
// FIX v4: Robust token management — no more Invalid JWT
// ============================================================

const AuthContext = createContext(null);

// Session timeout: 30 minutes of inactivity
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Synthetic email domain for auth (users log in with username only)
const EMAIL_DOMAIN = "ypoti.local";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);          // Supabase auth session
  const [profile, setProfile] = useState(null);           // profiles table row
  const [loading, setLoading] = useState(true);           // initial session check
  const [authError, setAuthError] = useState(null);       // last auth error
  const inactivityTimer = useRef(null);
  const profileFetchRef = useRef(false);                  // prevent duplicate fetches

  // ---- Derive currentUser from profile (backward-compat shape) ----
  const currentUser = profile ? {
    id: profile.id,
    name: profile.name,
    email: profile.username,        // old code uses "email" as username
    username: profile.username,
    role: profile.role,
    establishment: profile.establishment,
    position: profile.position,
    avatar: profile.avatar,
    active: profile.active,
    force_password_change: profile.force_password_change,
  } : null;

  const isAuthenticated = !!currentUser && currentUser.active !== false;

  // ---- Load profile from Supabase ----
  const loadProfile = useCallback(async (userId) => {
    if (!userId) return null;

    // Use the stored token if available (more reliable than relying on supabase-js client state)
    const token = getStoredToken();
    if (token) {
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
          {
            headers: {
              "apikey": supabaseAnonKey,
              "Authorization": `Bearer ${token}`,
            },
          }
        );
        if (res.ok) {
          const profiles = await res.json();
          return profiles?.[0] || null;
        }
      } catch (err) {
        console.warn("[Auth] REST profile fetch failed, falling back to client:", err);
      }
    }

    // Fallback to supabase-js client
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[Auth] Failed to load profile:", error.message);
      return null;
    }
    return data;
  }, []);

  // ---- Initialize: listen for auth state changes ----
  useEffect(() => {
    let mounted = true;

    // Safety timeout: if auth never resolves within 8s, show login
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[Auth] Safety timeout — showing login screen");
        setLoading(false);
      }
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log("[Auth] Event:", event, "hasSession:", !!newSession);

        if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (newSession?.access_token) {
            // CRITICAL: Always keep _accessToken in sync
            setStoredToken(newSession.access_token);
            setSession(newSession);

            // Load profile on initial session or sign-in (not on every token refresh)
            if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && !profileFetchRef.current) {
              profileFetchRef.current = true;
              try {
                const p = await loadProfile(newSession.user.id);
                if (mounted && p) setProfile(p);
              } catch (err) {
                console.error("[Auth] Profile load failed:", err);
              } finally {
                profileFetchRef.current = false;
              }
            }
          }

          // Resolve loading after initial session check
          if (event === "INITIAL_SESSION" && mounted) {
            setLoading(false);
            clearTimeout(safetyTimeout);
          }
        } else if (event === "SIGNED_OUT") {
          setStoredToken(null);
          setSession(null);
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [loadProfile, loading]);

  // ---- Inactivity timeout ----
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(async () => {
      await supabase.auth.signOut();
      setStoredToken(null);
      setSession(null);
      setProfile(null);
    }, SESSION_TIMEOUT_MS);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // ---- Login via direct fetch (bypasses supabase-js init lock) ----
  const login = useCallback(async (username, password) => {
    setAuthError(null);

    // Normalize: strip @domain if user typed it, lowercase
    let cleanUsername = username.toLowerCase().trim();
    if (cleanUsername.includes("@")) {
      cleanUsername = cleanUsername.split("@")[0];
    }

    const email = `${cleanUsername}@${EMAIL_DOMAIN}`;

    try {
      // Step 1: Authenticate via Auth REST API (10s timeout)
      const authController = new AbortController();
      const authTimeout = setTimeout(() => authController.abort(), 10000);

      const authRes = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "apikey": supabaseAnonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          signal: authController.signal,
        }
      );
      clearTimeout(authTimeout);

      if (!authRes.ok) {
        const errBody = await authRes.json().catch(() => ({}));
        const msg = (errBody.error_description || errBody.msg || errBody.error || "")
          .toLowerCase().includes("invalid")
          ? "Usuario o contraseña incorrecta"
          : errBody.error_description || errBody.msg || "Error de autenticación";
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const authData = await authRes.json();
      const { access_token, refresh_token, user: authUser } = authData;

      if (!access_token || !authUser?.id) {
        setAuthError("Respuesta de autenticación inválida");
        return { success: false, error: "Respuesta de autenticación inválida" };
      }

      // Step 2: Store token IMMEDIATELY so Edge Functions work right away
      setStoredToken(access_token);

      // Step 3: Load profile via REST API (uses stored token)
      const profileController = new AbortController();
      const profileTimeout = setTimeout(() => profileController.abort(), 10000);

      const profileRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${authUser.id}&select=*`,
        {
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${access_token}`,
          },
          signal: profileController.signal,
        }
      );
      clearTimeout(profileTimeout);

      if (!profileRes.ok) {
        setAuthError("Error cargando perfil");
        return { success: false, error: "Error cargando perfil" };
      }

      const profiles = await profileRes.json();
      const p = profiles?.[0] || null;

      if (!p) {
        setStoredToken(null);
        return { success: false, error: "Perfil de usuario no encontrado" };
      }

      if (p.active === false) {
        setStoredToken(null);
        return { success: false, error: "Tu cuenta está desactivada" };
      }

      // Step 4: Hydrate supabase-js client — AWAIT it, with timeout
      // This is important for: (a) RLS reads via supabase client, (b) token auto-refresh
      try {
        const setSessionResult = await Promise.race([
          supabase.auth.setSession({ access_token, refresh_token }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("setSession timeout")), 5000)),
        ]);

        if (setSessionResult?.error) {
          // Non-fatal: Edge Functions still work via stored token
          console.warn("[Auth] setSession returned error (non-fatal):", setSessionResult.error.message);
        }
      } catch (err) {
        // Non-fatal: supabase-js won't auto-refresh, but stored token works for ~1 hour
        console.warn("[Auth] setSession failed (non-fatal):", err.message);
        // Manually store in localStorage so supabase-js can pick it up on next page load
        try {
          const ref = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
          if (ref) {
            localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify({
              access_token,
              refresh_token,
              token_type: "bearer",
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              user: authUser,
            }));
          }
        } catch {}
      }

      // Step 5: Update React state
      const sessionObj = {
        access_token,
        refresh_token,
        user: authUser,
      };
      setSession(sessionObj);
      setProfile(p);
      profileFetchRef.current = false;

      return { success: true, user: p };
    } catch (err) {
      const isAbort = err.name === "AbortError";
      const msg = isAbort
        ? "El servidor no responde. Intenta de nuevo."
        : "Error de conexión. Intenta de nuevo.";
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ---- Logout ----
  const logout = useCallback(async () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    setStoredToken(null);
    try { await supabase.auth.signOut(); } catch {}
    setSession(null);
    setProfile(null);
    setAuthError(null);
  }, []);

  // ---- Permission check ----
  const can = useCallback((permission) => {
    return hasPermission(currentUser, permission);
  }, [currentUser]);

  // ---- Change password ----
  const changePassword = useCallback(async (newPassword) => {
    const token = getStoredToken() || session?.access_token;
    const userId = session?.user?.id;
    if (!token || !userId) {
      return { success: false, error: "No hay sesión activa" };
    }

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error_description || err.msg || "Error al cambiar contraseña" };
      }

      // Clear force_password_change flag
      const profileRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ force_password_change: false }),
        }
      );

      if (!profileRes.ok) {
        console.error("[Auth] Failed to clear force_password_change");
      }

      setProfile(prev => prev ? { ...prev, force_password_change: false } : prev);
      return { success: true };
    } catch (err) {
      return { success: false, error: "Error al cambiar contraseña" };
    }
  }, [session]);

  // ---- Refresh profile from DB ----
  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    const p = await loadProfile(session.user.id);
    if (p) setProfile(p);
  }, [session, loadProfile]);

  // ---- User management ----
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const refreshUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      await initUsers();
      setUsers(getUsers());
    } catch (err) {
      console.error("[Auth] refreshUsers failed:", err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setUsers(getUsers());
    }
  }, [isAuthenticated]);

  const addNewUser = useCallback(async (userData) => {
    try {
      const newUser = await addUserToDb(userData);
      setUsers(getUsers());
      return newUser;
    } catch (err) {
      console.error("[Auth] addNewUser failed:", err);
      throw err;
    }
  }, []);

  const editUser = useCallback(async (userId, updates) => {
    try {
      await updateUserInDb(userId, updates);
      setUsers(getUsers());
    } catch (err) {
      console.error("[Auth] editUser failed:", err);
      throw err;
    }
  }, []);

  const resetUserPassword = useCallback(async (userId) => {
    try {
      await resetPasswordInDb(userId);
    } catch (err) {
      console.error("[Auth] resetUserPassword failed:", err);
      throw err;
    }
  }, []);

  const resetUsers = useCallback(async () => {
    await refreshUsers();
  }, [refreshUsers]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      loading,
      authError,
      login,
      logout,
      can,
      changePassword,
      forcePasswordChange: currentUser?.force_password_change ?? false,
      profile,
      refreshProfile,
      users,
      usersLoading,
      addNewUser,
      editUser,
      resetUserPassword,
      resetUsers,
      refreshUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
