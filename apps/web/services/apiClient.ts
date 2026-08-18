import type { ApiErrorBody } from "@/types/auth";

/**
 * Base URL for the Antiq API.
 * Empty string = same-origin (Next `/api/...`).
 * Optional override: `NEXT_PUBLIC_API_URL` (e.g. http://localhost:4000).
 */
export function getApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.VITE_API_URL?.trim() ||
    "";
  return raw.replace(/\/$/, "");
}

function messageFromBody(body: ApiErrorBody | null, status: number): string {
  if (!body) return `Request failed (${status})`;
  if (typeof body.message === "string" && body.message.trim()) {
    return body.message;
  }
  if (typeof body.error === "string" && body.error.trim()) {
    return body.error;
  }
  if (Array.isArray(body.errors) && body.errors[0]) {
    return body.errors[0];
  }
  if (body.errors && typeof body.errors === "object") {
    const first = Object.values(body.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return `Request failed (${status})`;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

/**
 * Typed fetch wrapper for the Antiq backend.
 * Throws `ApiError` on 4xx/5xx and clear Errors on network failure.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { body, token, headers: initHeaders, ...rest } = options;
  const base = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(initHeaders);
  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Network error. Check your connection and that the API is reachable.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      messageFromBody(parsed as ApiErrorBody | null, response.status),
      response.status,
    );
  }

  return parsed as T;
}
