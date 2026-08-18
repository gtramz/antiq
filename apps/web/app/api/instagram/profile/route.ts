import { NextRequest, NextResponse } from "next/server";
import {
  fetchBusinessDiscovery,
  instagramConfigured,
  usernameFromInstagramUrl,
} from "@/modules/artists/instagram-server";

/**
 * GET /api/instagram/profile?url= | ?username=
 * Business Discovery — public Professional profile + recent media grid.
 */
export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  const usernameParam = req.nextUrl.searchParams.get("username");

  const username = usernameParam?.trim()
    ? usernameFromInstagramUrl(usernameParam) ??
      usernameParam.replace(/^@/, "").toLowerCase()
    : urlParam
      ? usernameFromInstagramUrl(urlParam)
      : null;

  if (!username) {
    return NextResponse.json(
      { error: "Missing or invalid Instagram profile url/username" },
      { status: 400 },
    );
  }

  if (!instagramConfigured()) {
    return NextResponse.json(
      {
        error: "Instagram credentials not configured",
        code: "NO_CREDENTIALS",
      },
      { status: 503 },
    );
  }

  const result = await fetchBusinessDiscovery(username);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json(result.profile);
}
