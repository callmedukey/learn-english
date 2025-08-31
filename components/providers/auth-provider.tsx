"use client";

import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  refreshSession: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const fetchSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    await fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    fetchSession();

    // Poll for session changes every 5 minutes
    const interval = setInterval(fetchSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  // Refresh session when navigating to dashboard after login
  useEffect(() => {
    if (pathname === "/dashboard" && !session && !isLoading) {
      fetchSession();
    }
  }, [pathname, session, isLoading, fetchSession]);

  // Clear session when navigating to login page (after logout)
  useEffect(() => {
    if (pathname === "/login" && session) {
      setSession(null);
      fetchSession(); // Verify session is actually cleared
    }
  }, [pathname, session, fetchSession]);

  return (
    <AuthContext.Provider value={{ session, isLoading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}