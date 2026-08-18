import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { dbQuery, qualifiedTable } from "@/lib/db";
import type { User, UserRole } from "@/types/auth";

const BCRYPT_ROUNDS = 10;
const TOKEN_TTL = "7d";

export type DbUserRow = {
  id: number;
  username: string | null;
  email: string;
  phone: string | null;
  password_hash: string;
  artist_name: string | null;
  email_verified: boolean | null;
  name: string | null;
  role: string | null;
  antiq_user_id: string | null;
  created_at: string;
  updated_at: string;
};

function authSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "AUTH_SECRET is not configured. Set it in apps/web/.env.local",
    );
  }
  return new TextEncoder().encode(secret);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isUserRole(value: unknown): value is UserRole {
  return value === "artist" || value === "investor";
}

export function displayName(row: DbUserRow): string {
  return (
    row.name?.trim() ||
    row.artist_name?.trim() ||
    row.username?.trim() ||
    row.email.split("@")[0] ||
    "User"
  );
}

export function toPublicUser(row: DbUserRow): User {
  if (!isUserRole(row.role)) {
    throw new Error("User row missing valid role");
  }
  return {
    id: String(row.id),
    name: displayName(row),
    email: normalizeEmail(row.email),
    role: row.role,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function signAuthToken(user: User): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(authSecret());
}

export async function verifyAuthToken(
  token: string,
): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, authSecret());
  const userId = typeof payload.sub === "string" ? payload.sub : "";
  if (!userId) throw new Error("Invalid token");
  return { userId };
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

export async function findUserByEmail(
  email: string,
): Promise<DbUserRow | null> {
  const table = qualifiedTable("users");
  const rows = await dbQuery<DbUserRow>(
    `SELECT * FROM ${table} WHERE lower(email) = lower($1) LIMIT 1`,
    [normalizeEmail(email)],
  );
  return rows[0] ?? null;
}

export async function findUserById(id: string | number): Promise<DbUserRow | null> {
  const table = qualifiedTable("users");
  const rows = await dbQuery<DbUserRow>(
    `SELECT * FROM ${table} WHERE id = $1 LIMIT 1`,
    [Number(id)],
  );
  return rows[0] ?? null;
}

export async function insertUser(input: {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  artistName?: string | null;
  username?: string | null;
  antiqUserId?: string | null;
}): Promise<DbUserRow> {
  const table = qualifiedTable("users");
  const email = normalizeEmail(input.email);
  const rows = await dbQuery<DbUserRow>(
    `INSERT INTO ${table} (
      email, password_hash, name, role, artist_name, username, antiq_user_id, email_verified, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW())
    RETURNING *`,
    [
      email,
      input.passwordHash,
      input.name,
      input.role,
      input.artistName ?? null,
      input.username ?? null,
      input.antiqUserId ?? null,
    ],
  );
  const row = rows[0];
  if (!row) throw new Error("Insert returned no row");
  return row;
}

export async function updateUserProfile(
  id: string | number,
  input: { name: string; email: string },
): Promise<DbUserRow> {
  const table = qualifiedTable("users");
  const email = normalizeEmail(input.email);
  const rows = await dbQuery<DbUserRow>(
    `UPDATE ${table}
     SET name = $2, email = $3, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [Number(id), input.name.trim(), email],
  );
  const row = rows[0];
  if (!row) throw new Error("User not found");
  return row;
}

export function jsonError(message: string, status: number) {
  return Response.json({ message, error: message }, { status });
}
