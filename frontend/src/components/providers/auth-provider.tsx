"use client";

/**
 * Auth context: holds the current user and exposes login/signup/logout.
 *
 * Hydrated on mount: if we have an access token we fetch /me. If /me returns
 * 401 (expired access) but a refresh token exists, the API client refreshes
 * transparently and retries, so the user stays logged in across reloads until
 * the refresh token itself expires.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
  getMe,
} from "@/lib/api";
import { getAccessToken, getRefreshToken } from "@/lib/tokens";
import type { User } from "@/lib/types";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  // Hydrate: only probe /me if we have any credential. If the access token is
  // expired, the API client will transparently refresh using the refresh token.
  useEffect(() => {
    if (!getAccessToken() && !getRefreshToken()) {
      setStatus("unauthenticated");
      return;
    }
    let active = true;
    getMe()
      .then((u) => {
        if (!active) return;
        if (u) {
          setUser(u);
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
      })
      .catch(() => active && setStatus("unauthenticated"));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
    setStatus("authenticated");
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const u = await apiSignup(email, password);
    setUser(u);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, signup, logout }),
    [user, status, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
