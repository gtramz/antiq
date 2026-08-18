import { ApiError, apiFetch } from "@/services/apiClient";
import type {
  AuthApiResponse,
  AuthSession,
  LoginCredentials,
  RegisterArtistPayload,
  RegisterInvestorPayload,
  UpdateProfilePayload,
  User,
  UserLookupResponse,
  UserRole,
} from "@/types/auth";

/** Session keys — JWT + cached user for cold start. */
export const AUTH_TOKEN_KEY = "antiq.auth.token";
export const AUTH_USER_KEY = "antiq.auth.user";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function assertEmailPassword(email: string, password: string): void {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  if (!isValidEmail(email)) {
    throw new Error("Enter a valid email address");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
}

function isUserRole(value: unknown): value is UserRole {
  return value === "artist" || value === "investor";
}

function normalizeUser(raw: Partial<User> | null | undefined): User {
  if (!raw?.id || !raw.email || !raw.name || !isUserRole(raw.role)) {
    throw new Error("Invalid user payload from server");
  }
  return {
    id: String(raw.id),
    name: String(raw.name),
    email: normalizeEmail(String(raw.email)),
    role: raw.role,
  };
}

function normalizeSession(payload: AuthApiResponse): AuthSession {
  const nested = payload.data;
  const user = normalizeUser(nested?.user ?? payload.user);
  const token =
    nested?.token ||
    nested?.accessToken ||
    payload.token ||
    payload.accessToken;
  if (!token || typeof token !== "string") {
    throw new Error("Auth response missing token");
  }
  return { user, token };
}

function persistSession(session: AuthSession): void {
  if (!isBrowser()) return;
  localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
}

function clearSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function readStoredUser(): User | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return normalizeUser(JSON.parse(raw) as Partial<User>);
  } catch {
    return null;
  }
}

/**
 * Auth API service — same-origin `/api/...` (or optional NEXT_PUBLIC_API_URL).
 * Session JWT is stored client-side after success.
 */
export const authService = {
  /**
   * Look up an email in the Antiq database.
   * GET /api/users/lookup?email=
   * 404 → { exists: false }
   */
  async verifyAntiqAccount(email: string): Promise<UserLookupResponse> {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      throw new Error("Email is required");
    }
    if (!isValidEmail(normalized)) {
      throw new Error("Enter a valid email address");
    }

    try {
      const data = await apiFetch<UserLookupResponse>(
        `/api/users/lookup?email=${encodeURIComponent(normalized)}`,
        { method: "GET" },
      );

      if (data && typeof data.exists === "boolean") {
        return {
          exists: data.exists,
          data: data.exists && data.data ? data.data : undefined,
        };
      }

      // Tolerate `{ user: AntiqUserData }` style payloads.
      const maybeUser = (data as { user?: UserLookupResponse["data"] })?.user;
      if (maybeUser?.email) {
        return { exists: true, data: maybeUser };
      }

      return { exists: false };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return { exists: false };
      }
      throw err instanceof Error
        ? err
        : new Error("Unable to verify Antiq account");
    }
  },

  /** POST /api/auth/login */
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const email = normalizeEmail(credentials.email ?? "");
    const password = credentials.password ?? "";
    assertEmailPassword(email, password);

    try {
      const payload = await apiFetch<AuthApiResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      const session = normalizeSession(payload);
      persistSession(session);
      return session;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw err instanceof Error ? err : new Error("Login failed");
    }
  },

  /** POST /api/auth/register/artist */
  async registerArtist(payload: RegisterArtistPayload): Promise<AuthSession> {
    const name = payload.name?.trim() ?? "";
    const email = normalizeEmail(payload.email ?? "");
    const password = payload.password ?? "";
    assertEmailPassword(email, password);

    if (!payload.antiqUserId && !name) {
      throw new Error("Name is required");
    }

    try {
      const body: Record<string, string> = { email, password };
      if (name) body.name = name;
      if (payload.antiqUserId) body.antiqUserId = payload.antiqUserId;

      const response = await apiFetch<AuthApiResponse>(
        "/api/auth/register/artist",
        { method: "POST", body },
      );
      const session = normalizeSession(response);
      persistSession(session);
      return session;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw err instanceof Error ? err : new Error("Artist registration failed");
    }
  },

  /** POST /api/auth/register/investor */
  async registerInvestor(
    payload: RegisterInvestorPayload,
  ): Promise<AuthSession> {
    const name = payload.name?.trim() ?? "";
    const email = normalizeEmail(payload.email ?? "");
    const password = payload.password ?? "";

    if (!name) throw new Error("Name is required");
    assertEmailPassword(email, password);

    try {
      const response = await apiFetch<AuthApiResponse>(
        "/api/auth/register/investor",
        {
          method: "POST",
          body: { name, email, password },
        },
      );
      const session = normalizeSession(response);
      persistSession(session);
      return session;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw err instanceof Error
        ? err
        : new Error("Investor registration failed");
    }
  },

  /** PATCH /api/auth/me — update name / email for the signed-in user. */
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const name = payload.name?.trim() ?? "";
    const email = normalizeEmail(payload.email ?? "");
    if (!name) throw new Error("Name is required");
    if (!email) throw new Error("Email is required");
    if (!isValidEmail(email)) throw new Error("Enter a valid email address");

    const token = isBrowser() ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (!token) throw new Error("You must be signed in to update your profile");

    try {
      const response = await apiFetch<AuthApiResponse | { user: User }>(
        "/api/auth/me",
        {
          method: "PATCH",
          token,
          body: { name, email },
        },
      );

      let user: User;
      try {
        user = normalizeSession(response as AuthApiResponse).user;
      } catch {
        user = normalizeUser((response as { user: User }).user);
      }

      // Keep existing token; refresh cached user.
      if (isBrowser()) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      }
      return user;
    } catch (err) {
      // Soft-fail offline / stub backends: persist locally so investors can edit.
      if (
        err instanceof ApiError &&
        (err.status === 404 || err.status === 405 || err.status === 501)
      ) {
        const cached = readStoredUser();
        if (!cached) throw err;
        const user: User = { ...cached, name, email };
        if (isBrowser()) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        }
        return user;
      }
      if (err instanceof ApiError) throw err;
      throw err instanceof Error ? err : new Error("Profile update failed");
    }
  },

  /**
   * Restore session: prefer GET /api/auth/me with stored JWT;
   * fall back to cached user if /me is unavailable (network) but token exists.
   */
  async restoreSession(): Promise<AuthSession | null> {
    if (!isBrowser()) return null;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      clearSession();
      return null;
    }

    try {
      const payload = await apiFetch<AuthApiResponse | { user: User }>(
        "/api/auth/me",
        { method: "GET", token },
      );
      const session = normalizeSession(payload as AuthApiResponse);
      persistSession(session);
      return session;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearSession();
        return null;
      }
      // Offline / me not deployed yet — keep cached session if valid.
      const cached = readStoredUser();
      if (cached) return { user: cached, token };
      clearSession();
      return null;
    }
  },

  async logout(): Promise<void> {
    const token = isBrowser() ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
    try {
      if (token) {
        await apiFetch("/api/auth/logout", { method: "POST", token });
      }
    } catch {
      // Always clear local session even if revoke fails.
    } finally {
      clearSession();
    }
  },

  getToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
};

export const login = (credentials: LoginCredentials) =>
  authService.login(credentials);

export const registerArtist = (payload: RegisterArtistPayload) =>
  authService.registerArtist(payload);

export const registerInvestor = (payload: RegisterInvestorPayload) =>
  authService.registerInvestor(payload);

export const verifyAntiqAccount = (email: string) =>
  authService.verifyAntiqAccount(email);

export const restoreSession = () => authService.restoreSession();

export const updateProfile = (payload: UpdateProfilePayload) =>
  authService.updateProfile(payload);

export const logout = () => authService.logout();
