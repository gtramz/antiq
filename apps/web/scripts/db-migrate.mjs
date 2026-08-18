/**
 * Apply db/schema.sql — ONLY creates/updates antiq_dev.*
 * Refuses to run statements that mention public. (safety net)
 *
 * Usage: pnpm --filter @antiq/web db:migrate
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

if (process.env.NODE_ENV === "production") {
  console.error(
    "Refusing db:migrate in production. Deploy uses public schema; local migrate is antiq_dev only.",
  );
  process.exit(1);
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is missing. Load apps/web/.env.local first.");
  process.exit(1);
}

const schema = readFileSync(join(root, "db/schema.sql"), "utf8");
const statements = schema
  .split(";")
  .map((s) =>
    s
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim(),
  )
  .filter(Boolean);

for (const statement of statements) {
  const lower = statement.toLowerCase();
  if (/\bpublic\./.test(lower) || /\balter\s+table\s+users\b/.test(lower)) {
    console.error("Blocked statement that could touch public schema:\n", statement);
    process.exit(1);
  }
}

const sql = neon(url);

for (const statement of statements) {
  await sql.query(statement, []);
  console.log("ok:", statement.slice(0, 72).replace(/\s+/g, " "), "…");
}

console.log("Migration complete (antiq_dev only).");
