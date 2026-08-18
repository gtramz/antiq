import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/** Lightweight DB connectivity check (server-only). */
export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`select 1 as ok`;
    return NextResponse.json({
      ok: true,
      database: "connected",
      result: rows[0] ?? null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Database connection failed";
    return NextResponse.json(
      { ok: false, database: "error", message },
      { status: 503 },
    );
  }
}
