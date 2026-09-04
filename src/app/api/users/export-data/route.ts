import { validateRequest } from "@/auth";
import { NextResponse } from "next/server";
import { serverError, unauthorized } from "@/lib/api/responses";
import { exportUserData } from "@/app/(auth)/deleteAccount";

export async function GET() {
  try {
    // Authenticate here rather than relying on the delegated server action to
    // throw. The action does check the session, but its "Unauthorized" throw
    // landed in the catch below and became a 500 — so an unauthenticated caller
    // got a server error instead of a 401, and genuine failures were
    // indistinguishable from auth failures in the logs.
    const { user } = await validateRequest();
    if (!user) {
      return unauthorized();
    }

    const result = await exportUserData();

    if (result.success && result.data) {
      return NextResponse.json(
        {
          message: result.message,
          data: result.data,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in export data API:", error);
    return serverError();
  }
}
