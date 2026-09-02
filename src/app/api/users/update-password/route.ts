import { updateUserPassword } from "@/app/(main)/users/[username]/actions";
import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api/responses";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const { currentPassword, newPassword, isSettingPassword } = data;

    const result = isSettingPassword
      ? await updateUserPassword({ newPassword })
      : await updateUserPassword({ currentPassword, newPassword });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating password:", error);
    return serverError();
  }
}
