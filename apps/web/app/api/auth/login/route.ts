import {
  findUserByEmail,
  isValidEmail,
  jsonError,
  normalizeEmail,
  signAuthToken,
  toPublicUser,
  verifyPassword,
} from "@/lib/auth-server";

/** POST /api/auth/login */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";

    if (!email || !password) {
      return jsonError("Email and password are required", 400);
    }
    if (!isValidEmail(email)) {
      return jsonError("Enter a valid email address", 400);
    }

    const row = await findUserByEmail(email);
    if (!row?.password_hash) {
      return jsonError("Invalid email or password", 401);
    }

    const ok = await verifyPassword(password, row.password_hash);
    if (!ok) {
      return jsonError("Invalid email or password", 401);
    }

    let user;
    try {
      user = toPublicUser(row);
    } catch {
      return jsonError("Account is missing a valid role", 403);
    }

    const token = await signAuthToken(user);
    return Response.json({ user, token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return jsonError(message, 500);
  }
}
