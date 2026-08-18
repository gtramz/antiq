"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  login as loginRequest,
  logout as logoutRequest,
  registerArtist as registerArtistRequest,
  registerInvestor as registerInvestorRequest,
  restoreSession,
  updateProfile as updateProfileRequest,
} from "@/services/authService";
import type {
  LoginCredentials,
  RegisterArtistPayload,
  RegisterInvestorPayload,
  UpdateProfilePayload,
  User,
} from "@/types/auth";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  registerArtist: (payload: RegisterArtistPayload) => Promise<User>;
  registerInvestor: (payload: RegisterInvestorPayload) => Promise<User>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsLoading(true);
      try {
        const session = await restoreSession();
        if (!cancelled) {
          setUser(session?.user ?? null);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setUser(null);
          setError(toErrorMessage(err));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await loginRequest(credentials);
      setUser(session.user);
      return session.user;
    } catch (err) {
      const message = toErrorMessage(err);
      setError(message);
      setUser(null);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerArtist = useCallback(async (payload: RegisterArtistPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await registerArtistRequest(payload);
      setUser(session.user);
      return session.user;
    } catch (err) {
      const message = toErrorMessage(err);
      setError(message);
      setUser(null);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerInvestor = useCallback(
    async (payload: RegisterInvestorPayload) => {
      setIsLoading(true);
      setError(null);
      try {
        const session = await registerInvestorRequest(payload);
        setUser(session.user);
        return session.user;
      } catch (err) {
        const message = toErrorMessage(err);
        setError(message);
        setUser(null);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    setError(null);
    try {
      const next = await updateProfileRequest(payload);
      setUser(next);
      return next;
    } catch (err) {
      const message = toErrorMessage(err);
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await logoutRequest();
      setUser(null);
    } catch (err) {
      const message = toErrorMessage(err);
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      isAuthenticated: Boolean(user),
      login,
      registerArtist,
      registerInvestor,
      updateProfile,
      logout,
      clearError,
    }),
    [
      user,
      isLoading,
      error,
      login,
      registerArtist,
      registerInvestor,
      updateProfile,
      logout,
      clearError,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
