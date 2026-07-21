import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as authApi from "../api/auth.js";
import { clearAuthStorage } from "../api/client.js";

const AuthContext = createContext(null);

// auth state for the whole app. always uses localStorage (no mixing with sessionStorage)
// and login() writes userRole/userId too since client.js needs userRole to figure out
// where to redirect on a 403. if /me fails you're just logged out, no fallback that
// builds a fake user from whatever's sitting in storage
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await authApi.me();
      setUser(u);
      localStorage.setItem("userRole", u.role);
      localStorage.setItem("userId", u.id);
      localStorage.setItem("userEmail", u.email);
    } catch {
      clearAuthStorage();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email, password, expectedRole) => {
    const { user: u, token } = await authApi.login({ email, password, expectedRole });
    localStorage.setItem("token", token);
    localStorage.setItem("userRole", u.role);
    localStorage.setItem("userId", u.id);
    localStorage.setItem("userEmail", u.email);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
