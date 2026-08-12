import { NextRequest, NextResponse } from "next/server";

export type SpotifyOEmbed = {
  title: string;
  provider_name: string;
  thumbnail_url?: string;
  html?: string;
  author_name?: string;
};

/** Proxy Spotify oEmbed — no client credentials required. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith("https://open.spotify.com/")) {
    return NextResponse.json({ error: "Invalid Spotify URL" }, { status: 400 });
  }

  try {
    const endpoint = new URL("https://open.spotify.com/oembed");
    endpoint.searchParams.set("url", url);
    const res = await fetch(endpoint.toString(), {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Spotify oEmbed failed" },
        { status: res.status },
      );
    }
    const data = (await res.json()) as SpotifyOEmbed;
    return NextResponse.json({
      title: data.title,
      provider_name: data.provider_name,
      thumbnail_url: data.thumbnail_url,
      author_name: data.author_name,
      html: data.html,
    });
  } catch {
    return NextResponse.json({ error: "Spotify oEmbed error" }, { status: 502 });
  }
}
