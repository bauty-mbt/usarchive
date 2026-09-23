import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setAccessToken } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar: intenta refrescar sesión desde la cookie httpOnly.
  // Si hay sesión válida, queda el access token en memoria.
  useEffect(() => {
    (async () => {
      try {
        const res = await api<{ accessToken: string }>("/auth/refresh", {
          method: "POST",
          skipAuth: true,
        });
        setAccessToken(res.accessToken);
        const me = await api<{ user: User }>("/auth/me");
        setUser(me.user);
      } catch {
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await api<{ accessToken: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    setAccessToken(res.accessToken);
    setUser(res.user);
  }

  async function register(email: string, password: string, displayName: string) {
    const res = await api<{ accessToken: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
      skipAuth: true,
    });
    setAccessToken(res.accessToken);
    setUser(res.user);
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
