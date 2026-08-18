import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const sql = neon(url);
const rows = await sql`select current_database() as db, now() as now`;
console.log(rows);
