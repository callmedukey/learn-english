import { useRouter, useSegments } from "expo-router";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { apiClient } from "../api/client";
import { authEvents } from "./events";
import { authStorage } from "./storage";

interface User {
  id: string;
  email: string;
  name: string | null;
  nickname: string | null;
  role: string;
  gender: string | null;
  birthday: string | null;
  country: string | null;
  campusId: string | null;
  hasPaidSubscription: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Check auth state on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await authStorage.getAccessToken();
        if (token) {
          const storedUser = await authStorage.getUser<User>();
          if (storedUser) {
            setUser(storedUser);
          } else {
            // Fetch fresh user data
            const response = await apiClient.get("/api/mobile-auth/me");
            setUser(response.data.user);
            await authStorage.setUser(response.data.user);
          }
        }
      } catch {
        await authStorage.clearAll();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Listen for forced sign out (e.g., from API client on 401)
  useEffect(() => {
    const unsubscribe = authEvents.subscribe(() => {
      setUser(null);
    });
    return unsubscribe;
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    // Check if on an auth screen (login, signup, forgot-password)
    const authRoutes = ["login", "signup", "forgot-password"];
    const currentRoute = segments[segments.length - 1];
    const inAuthGroup = authRoutes.includes(currentRoute as string);

    if (!user && !inAuthGroup) {
      // Not logged in, redirect to login
      router.replace("/login");
    } else if (user && inAuthGroup) {
      // Logged in but on auth screen, redirect to app
      router.replace("/");
    }
  }, [user, segments, isLoading, router]);

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.post("/api/mobile-auth/login", {
      email,
      password,
    });

    const { accessToken, refreshToken, user: userData } = response.data;

    await authStorage.setAccessToken(accessToken);
    await authStorage.setRefreshToken(refreshToken);
    await authStorage.setUser(userData);

    setUser(userData);
  };

  const signOut = async () => {
    await authStorage.clearAll();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get("/api/mobile-auth/me");
      setUser(response.data.user);
      await authStorage.setUser(response.data.user);
    } catch {
      await signOut();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
