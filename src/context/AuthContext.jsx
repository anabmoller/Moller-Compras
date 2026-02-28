import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getUsers, saveUsers, addUser as addUserToStore, updateUser as updateUserInStore, resetUsersToDefault, hasPermission } from "../constants/users";

const AuthContext = createContext(null);

import { STORAGE_KEYS } from "../constants/storageKeys";

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => getUsers());

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const allUsers = getUsers();
        const found = allUsers.find(u => u.id === parsed.id);
        if (found && found.active !== false) return found;
      } catch { /* fall through */ }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ id: currentUser.id }));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  }, [currentUser]);

  const login = useCallback((input, password) => {
    const allUsers = getUsers();
    const normalize = (s) => s.toLowerCase().replace(/[.\-_\s]/g, "");
    const user = allUsers.find(
      u => (u.email.toLowerCase() === input.toLowerCase() || normalize(u.email) === normalize(input))
        && u.password === password && u.active !== false
    );
    if (user) {
      setCurrentUser(user);
      return { success: true, user };
    }
    return { success: false, error: "Usuario o contraseña incorrecta" };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const can = useCallback((permission) => {
    return hasPermission(currentUser, permission);
  }, [currentUser]);

  // ---- User management (admin) ----
  const refreshUsers = useCallback(() => {
    setUsers([...getUsers()]);
  }, []);

  const addNewUser = useCallback((userData) => {
    const newUser = addUserToStore(userData);
    setUsers([...getUsers()]);
    return newUser;
  }, []);

  const editUser = useCallback((id, updates) => {
    updateUserInStore(id, updates);
    setUsers([...getUsers()]);
    // If editing self, update currentUser
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  }, [currentUser]);

  const resetUsers = useCallback(() => {
    const fresh = resetUsersToDefault();
    setUsers(fresh);
    // If current user no longer exists, logout
    if (currentUser && !fresh.find(u => u.id === currentUser.id)) {
      setCurrentUser(null);
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      login,
      logout,
      can,
      users,
      addNewUser,
      editUser,
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
