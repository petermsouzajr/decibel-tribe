import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api/responses";
import { reactivateUserAccount } from "@/app/(auth)/deleteAccount";

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();

    // Deliberately unauthenticated: the account is deleted, so there is no
    // session. Ownership is proved with the password instead — previously a
    // bare userId was enough to restore anyone's account.
    if (!userId || !password) {
      return NextResponse.json(
        { error: "User ID and password are required" },
        { status: 400 },
      );
    }

    const result = await reactivateUserAccount(userId, password);

    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in reactivate account API:", error);
    return serverError();
  }
}
