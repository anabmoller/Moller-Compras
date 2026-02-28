import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
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

    // Safety: if auth never resolves, stop loading and show login
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("[Auth] Session check timed out — showing login");
        setLoading(false);
      }
    }, 5000);

    // Single listener handles everything: initial session + subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          if (newSession?.user) {
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
          setSession(null);
          setProfile(null);
        } else if (event === "TOKEN_REFRESHED" && newSession) {
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
      console.log("[Auth] Session expired due to inactivity");
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

  // ---- Login via Supabase Auth ----
  const login = useCallback(async (username, password) => {
    setAuthError(null);

    // Normalize: strip @domain if user typed it, lowercase
    let cleanUsername = username.toLowerCase().trim();
    if (cleanUsername.includes("@")) {
      cleanUsername = cleanUsername.split("@")[0];
    }

    const email = `${cleanUsername}@${EMAIL_DOMAIN}`;

    try {
      // Timeout: if signInWithPassword hangs, fail after 10s
      const authResult = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("LOGIN_TIMEOUT")), 10000)
        ),
      ]);

      const { data, error } = authResult;

      if (error) {
        const msg = error.message.includes("Invalid login")
          ? "Usuario o contraseña incorrecta"
          : error.message;
        setAuthError(msg);
        return { success: false, error: msg };
      }

      // Load profile (with timeout)
      const p = await Promise.race([
        loadProfile(data.user.id),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("PROFILE_TIMEOUT")), 10000)
        ),
      ]);

      if (!p) {
        await supabase.auth.signOut();
        return { success: false, error: "Perfil de usuario no encontrado" };
      }

      if (p.active === false) {
        await supabase.auth.signOut();
        return { success: false, error: "Tu cuenta está desactivada" };
      }

      setSession(data.session);
      setProfile(p);
      profileFetchRef.current = false;

      return { success: true, user: p };
    } catch (err) {
      const isTimeout = err.message === "LOGIN_TIMEOUT" || err.message === "PROFILE_TIMEOUT";
      const msg = isTimeout
        ? "El servidor no responde. Intenta de nuevo."
        : "Error de conexión. Intenta de nuevo.";
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, [loadProfile]);

  // ---- Logout ----
  const logout = useCallback(async () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    await supabase.auth.signOut();
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
    if (!session) {
      return { success: false, error: "No hay sesión activa" };
    }

    try {
      // Update password in Supabase Auth
      const { error: authErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authErr) {
        return { success: false, error: authErr.message };
      }

      // Clear force_password_change flag in profile
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ force_password_change: false })
        .eq("id", session.user.id);

      if (profileErr) {
        console.error("[Auth] Failed to clear force_password_change:", profileErr.message);
        // Password was changed successfully, just the flag update failed
        // Still mark as success and update local state
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
    console.warn("[Auth] resetUsers: Not available in Supabase mode. Refreshing from DB instead.");
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
