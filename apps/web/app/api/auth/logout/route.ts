/** POST /api/auth/logout — client clears JWT; no server session store. */
export async function POST() {
  return new Response(null, { status: 204 });
}
