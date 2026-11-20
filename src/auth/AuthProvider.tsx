import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi } from "../api/auth";
import { hasStoredAuthSession, refreshAccessToken, setAccessToken, storeCsrfToken } from "../api/client";
import type { PublicUser } from "../api/types";

interface AuthContextValue {
  user: PublicUser | null;
  isBootstrapping: boolean;
  login: (input: { identifier: string; password: string }) => Promise<void>;
  register: (input: { name: string; email?: string; phone?: string; password: string }) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const requireCustomer = (user: PublicUser): PublicUser => {
  if (user.role !== "customer") {
    throw new Error("This portal is for customers. Staff should use the staff application.");
  }
  return user;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    if (!hasStoredAuthSession()) {
      setIsBootstrapping(false);
    } else {
      refreshAccessToken()
        .then((result) => {
          if (active) setUser(requireCustomer(result.user));
        })
        .catch(() => {
          setAccessToken(null);
          storeCsrfToken(null);
          queryClient.removeQueries({ queryKey: ["customer"] });
          if (active) setUser(null);
        })
        .finally(() => {
          if (active) setIsBootstrapping(false);
        });
    }

    const expire = () => {
      setUser(null);
      queryClient.removeQueries({ queryKey: ["customer"] });
    };
    window.addEventListener("salon:session-expired", expire);
    return () => {
      active = false;
      window.removeEventListener("salon:session-expired", expire);
    };
  }, [queryClient]);

  const login = useCallback(async (input: { identifier: string; password: string }) => {
    const result = await authApi.login(input);
    try {
      setUser(requireCustomer(result.user));
    } catch (error) {
      await authApi.logout();
      throw error;
    }
  }, []);

  const register = useCallback(async (input: { name: string; email?: string; phone?: string; password: string }) => {
    const result = await authApi.register(input);
    setUser(requireCustomer(result.user));
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const result = await authApi.google(idToken);
    setUser(requireCustomer(result.user));
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setAccessToken(null);
    storeCsrfToken(null);
    setUser(null);
    queryClient.removeQueries({ queryKey: ["customer"] });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isBootstrapping, login, register, googleLogin, logout }),
    [user, isBootstrapping, login, register, googleLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
