import {
  findUserByEmail,
  hashPassword,
  insertUser,
  isValidEmail,
  jsonError,
  normalizeEmail,
  signAuthToken,
  toPublicUser,
} from "@/lib/auth-server";

/** POST /api/auth/register/investor — INSERT into active schema only. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";
    const name = body.name?.trim() ?? "";

    if (!name) return jsonError("Name is required", 400);
    if (!email || !password) {
      return jsonError("Email and password are required", 400);
    }
    if (!isValidEmail(email)) {
      return jsonError("Enter a valid email address", 400);
    }
    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters", 400);
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return jsonError("An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(password);
    const row = await insertUser({
      email,
      passwordHash,
      name,
      role: "investor",
      username: name,
    });

    const user = toPublicUser(row);
    const token = await signAuthToken(user);
    return Response.json({ user, token }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Investor registration failed";
    return jsonError(message, 500);
  }
}
