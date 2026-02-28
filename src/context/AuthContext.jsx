import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase, supabaseUrl, supabaseAnonKey, setStoredToken } from "../lib/supabase";
import {
  hasPermission, getUsers, initUsers,
  addUser as addUserToDb, updateUser as updateUserInDb,
  resetPassword as resetPasswordInDb,
} from "../constants/users";

// ============================================================
// YPOTI — AuthContext (Supabase Auth)
// Phase 4: Authentication migrated from localStorage to Supabase
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
  // Uses INITIAL_SESSION event (supabase-js v2.39+) instead of getSession()
  // which can hang if token refresh stalls during client initialization.
  useEffect(() => {
    let mounted = true;

    // Safety: if auth never resolves, clear stale session and show login
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        const ref = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
        if (ref) {
          try { localStorage.removeItem(`sb-${ref}-auth-token`); } catch {}
        }
        setLoading(false);
      }
    }, 5000);

    // Single listener handles everything: initial session + subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          if (newSession?.user) {
            // Keep _accessToken in sync with supabase-js auth state
            if (newSession.access_token) {
              setStoredToken(newSession.access_token);
            }
            setSession(newSession);
            if (!profileFetchRef.current) {
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
          // Resolve loading after initial session (whether or not there's a user)
          if (event === "INITIAL_SESSION" && mounted) {
            setLoading(false);
            clearTimeout(safetyTimeout);
          }
        } else if (event === "SIGNED_OUT") {
          setStoredToken(null);
          setSession(null);
          setProfile(null);
        } else if (event === "TOKEN_REFRESHED" && newSession) {
          // CRITICAL: update _accessToken so Edge Functions use the fresh JWT
          setStoredToken(newSession.access_token);
          setSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [loadProfile]);

  // ---- Inactivity timeout ----
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(async () => {
      await supabase.auth.signOut();
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
  // supabase.auth.signInWithPassword() can hang indefinitely when a stale
  // session causes the internal _initialize() lock to block.  Using fetch()
  // against the Auth REST API directly — proven to work via curl.
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

      // Step 2: Load profile via REST API (10s timeout)
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
        return { success: false, error: "Perfil de usuario no encontrado" };
      }

      if (p.active === false) {
        return { success: false, error: "Tu cuenta está desactivada" };
      }

      // Step 3: Store token for Edge Function calls + hydrate supabase-js client
      // The stored token is used by invokeEdgeFunction (direct fetch) immediately.
      // Since localStorage was cleared before client creation, _initialize() completed
      // instantly — setSession() works on the existing client without blocking.
      setStoredToken(access_token);

      // Hydrate the SINGLE supabase-js client with the session from fetch-based login.
      // The onAuthStateChange listener (useEffect above) handles TOKEN_REFRESHED events
      // and keeps _accessToken in sync — no need for a second listener here.
      supabase.auth.setSession({
        access_token,
        refresh_token,
      }).catch((err) => {
        console.error("[Auth] setSession failed:", err);
      });

      // Step 4: Update React state directly
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

  // ---- Permission check (uses ROLES from constants/users.js) ----
  const can = useCallback((permission) => {
    return hasPermission(currentUser, permission);
  }, [currentUser]);

  // ---- Change password ----
  const changePassword = useCallback(async (newPassword) => {
    const token = session?.access_token;
    const userId = session?.user?.id;
    if (!token || !userId) {
      return { success: false, error: "No hay sesión activa" };
    }

    try {
      // Update password via Auth REST API (bypasses potential supabase-js lock)
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

      // Clear force_password_change flag in profile via REST API
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

      // Update local profile state
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

  // ---- User management (Supabase-backed via users.js) ----
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Refresh users list from Supabase cache
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

  // Load users once on mount (after auth is ready)
  useEffect(() => {
    if (isAuthenticated) {
      setUsers(getUsers()); // sync from cache (AppContext already called initUsers)
    }
  }, [isAuthenticated]);

  // Add new user (creates Supabase auth + profile)
  const addNewUser = useCallback(async (userData) => {
    try {
      const newUser = await addUserToDb(userData);
      setUsers(getUsers()); // refresh from cache
      return newUser;
    } catch (err) {
      console.error("[Auth] addNewUser failed:", err);
      throw err;
    }
  }, []);

  // Edit existing user profile
  const editUser = useCallback(async (userId, updates) => {
    try {
      await updateUserInDb(userId, updates);
      setUsers(getUsers()); // refresh from cache
    } catch (err) {
      console.error("[Auth] editUser failed:", err);
      throw err;
    }
  }, []);

  // Reset user's password to default
  const resetUserPassword = useCallback(async (userId) => {
    try {
      await resetPasswordInDb(userId);
    } catch (err) {
      console.error("[Auth] resetUserPassword failed:", err);
      throw err;
    }
  }, []);

  // Reset all users to defaults (not available in Supabase mode)
  const resetUsers = useCallback(async () => {
    await refreshUsers();
  }, [refreshUsers]);

  return (
    <AuthContext.Provider value={{
      // Core auth
      currentUser,
      isAuthenticated,
      loading,
      authError,
      login,
      logout,
      can,

      // Password management
      changePassword,
      forcePasswordChange: currentUser?.force_password_change ?? false,

      // Profile
      profile,
      refreshProfile,

      // User management (Supabase-backed)
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
