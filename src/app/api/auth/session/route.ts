import { validateRequestWithCookieMutation } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Session cookie sync endpoint.
 *
 * Best-practice in Next.js App Router:
 * - Server Components can READ cookies but cannot MUTATE them.
 * - Cookie refresh/clearing should happen in a Route Handler / Server Action.
 *
 * The client can call this once per app load to:
 * - refresh a "fresh" Lucia session cookie
 * - clear an invalid/stale session cookie
 */
export async function POST() {
  await validateRequestWithCookieMutation();
  return new NextResponse(null, { status: 204 });
}

