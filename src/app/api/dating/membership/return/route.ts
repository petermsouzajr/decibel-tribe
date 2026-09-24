import { NextRequest, NextResponse } from "next/server";

/** Stripe can only return to https. This hands the browser back to the Expo app. */
export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const canceled = url.searchParams.get("result") === "cancel";
  const tier = url.searchParams.get("tier") === "id" ? "id" : "person";
  const target = canceled
    ? "datingtribe://membership/cancel"
    : `datingtribe://membership/success?tier=${tier}`;
  return NextResponse.redirect(target, 302);
}
