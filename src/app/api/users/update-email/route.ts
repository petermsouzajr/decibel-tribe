import { validateRequest } from "@/auth";
import { updateUserEmail } from "@/app/(main)/users/[username]/actions";
import { NextRequest, NextResponse } from "next/server";
import { serverError, unauthorized } from "@/lib/api/responses";

export async function POST(req: NextRequest) {
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

    const data = await req.json();

    const { currentPassword, newEmail } = data;

    const result = await updateUserEmail({ currentPassword, newEmail });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating email:", error);
    return serverError();
  }
}
