import {
  bearerToken,
  findUserByEmail,
  findUserById,
  isValidEmail,
  jsonError,
  normalizeEmail,
  signAuthToken,
  toPublicUser,
  updateUserProfile,
  verifyAuthToken,
} from "@/lib/auth-server";

async function requireUser(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return { error: jsonError("Unauthorized", 401) as Response };
  }
  try {
    const { userId } = await verifyAuthToken(token);
    const row = await findUserById(userId);
    if (!row) {
      return { error: jsonError("Unauthorized", 401) as Response };
    }
    return { row, token };
  } catch {
    return { error: jsonError("Unauthorized", 401) as Response };
  }
}

/** GET /api/auth/me */
export async function GET(request: Request) {
  try {
    const auth = await requireUser(request);
    if ("error" in auth && auth.error) return auth.error;

    const user = toPublicUser(auth.row!);
    const token = await signAuthToken(user);
    return Response.json({ user, token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load profile";
    return jsonError(message, 500);
  }
}

/** PATCH /api/auth/me */
export async function PATCH(request: Request) {
  try {
    const auth = await requireUser(request);
    if ("error" in auth && auth.error) return auth.error;

    const body = (await request.json()) as {
      name?: string;
      email?: string;
    };
    const name = body.name?.trim() ?? "";
    const email = normalizeEmail(body.email ?? "");

    if (!name) return jsonError("Name is required", 400);
    if (!email) return jsonError("Email is required", 400);
    if (!isValidEmail(email)) {
      return jsonError("Enter a valid email address", 400);
    }

    const current = auth.row!;
    if (normalizeEmail(current.email) !== email) {
      const taken = await findUserByEmail(email);
      if (taken && taken.id !== current.id) {
        return jsonError("An account with this email already exists", 409);
      }
    }

    const row = await updateUserProfile(current.id, { name, email });
    const user = toPublicUser(row);
    const token = await signAuthToken(user);
    return Response.json({ user, token });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Profile update failed";
    return jsonError(message, 500);
  }
}
