import {
  displayName,
  findUserByEmail,
  isUserRole,
  isValidEmail,
  jsonError,
  normalizeEmail,
} from "@/lib/auth-server";

/** GET /api/users/lookup?email= — search active schema only (antiq_dev in dev). */
export async function GET(request: Request) {
  try {
    const email = normalizeEmail(
      new URL(request.url).searchParams.get("email") ?? "",
    );
    if (!email) return jsonError("Email is required", 400);
    if (!isValidEmail(email)) return jsonError("Enter a valid email address", 400);

    const row = await findUserByEmail(email);
    if (!row) {
      return Response.json({ exists: false });
    }

    return Response.json({
      exists: true,
      data: {
        id: row.antiq_user_id || String(row.id),
        name: displayName(row),
        email: normalizeEmail(row.email),
        role: isUserRole(row.role) ? row.role : undefined,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to look up user";
    return jsonError(message, 500);
  }
}
