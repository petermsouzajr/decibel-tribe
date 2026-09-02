import { updateUserEmail } from "@/app/(main)/users/[username]/actions";
import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api/responses";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const { currentPassword, newEmail } = data;

    const result = await updateUserEmail({ currentPassword, newEmail });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating email:", error);
    return serverError();
  }
}
