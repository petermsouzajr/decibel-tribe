import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api/responses";
import {
  deleteUserAccount,
  DeleteAccountFormData,
} from "@/app/(auth)/deleteAccount";

export async function POST(request: NextRequest) {
  try {
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
