import { validateRequest } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { serverError, unauthorized } from "@/lib/api/responses";
import {
  deleteUserAccount,
  DeleteAccountFormData,
} from "@/app/(auth)/deleteAccount";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { password, confirmDeletion }: DeleteAccountFormData = body;

    if (!password || !confirmDeletion) {
      return NextResponse.json(
        { error: "Password and confirmation are required" },
        { status: 400 },
      );
    }

    const result = await deleteUserAccount({ password, confirmDeletion });

    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in delete account API:", error);
    return serverError();
  }
}
