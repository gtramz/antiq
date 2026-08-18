/** Authenticated account roles. */
export type UserRole = "artist" | "investor";

/** App session user (normalized from backend). */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Antiq catalog / CRM user returned by lookup. */
export interface AntiqUserData {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  avatarUrl?: string;
}

/** GET /api/users/lookup?email= */
export interface UserLookupResponse {
  exists: boolean;
  data?: AntiqUserData;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/** PATCH /api/auth/me — editable account fields. */
export interface UpdateProfilePayload {
  name: string;
  email: string;
}

/** POST /api/auth/register/artist */
export interface RegisterArtistPayload {
  name: string;
  email: string;
  password: string;
  /** When linking an existing Antiq catalog account. */
  antiqUserId?: string;
}

/** POST /api/auth/register/investor */
export interface RegisterInvestorPayload {
  name: string;
  email: string;
  password: string;
}

/** @deprecated Prefer role-specific payloads; kept for generic helpers. */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  antiqUserId?: string;
}

/** Successful auth response from the backend. */
export interface AuthSession {
  user: User;
  token: string;
}

/** Raw backend auth envelope (tolerant of common shapes). */
export interface AuthApiResponse {
  user: User;
  token: string;
  accessToken?: string;
  data?: {
    user: User;
    token?: string;
    accessToken?: string;
  };
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
  errors?: string[] | Record<string, string[]>;
}
