import { lucia } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const refreshToken =
    typeof body.refreshToken === "string" ? body.refreshToken.trim() : "";

  if (!refreshToken) {
    return NextResponse.json({ error: "Refresh token required" }, { status: 400 });
  }

  try {
    const result = await lucia.validateSession(refreshToken);
    if (!result.session || !result.user) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    return NextResponse.json({
      token: result.session.id,
      refreshToken: result.session.id,
    });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }
}
