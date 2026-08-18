import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const ALLOWED_SCHEMAS = new Set(["antiq_dev", "public"] as const);

/**
 * Logical DB isolation on a shared Neon instance:
 * - development → antiq_dev (never touches public.*)
 * - production → public
 */
export function dbSchema(): "antiq_dev" | "public" {
  const schema =
    process.env.NODE_ENV === "production" ? "public" : "antiq_dev";
  if (!ALLOWED_SCHEMAS.has(schema)) {
    throw new Error(`Refusing unknown DB schema: ${schema}`);
  }
  return schema;
}

/** Qualified identifier, e.g. "antiq_dev"."users" */
export function qualifiedTable(table: string): string {
  const schema = dbSchema();
  if (!/^[a-z_][a-z0-9_]*$/i.test(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  return `"${schema}"."${table}"`;
}

/**
 * Neon Postgres client (server-only).
 * Requires `DATABASE_URL` in the environment.
 */
export function getDb(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Set it in apps/web/.env.local",
    );
  }
  return neon(url);
}

/** Parameterized query against the active schema (safe identifier injection). */
export async function dbQuery<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const sql = getDb();
  const rows = await sql.query(text, params);
  return rows as T[];
}
