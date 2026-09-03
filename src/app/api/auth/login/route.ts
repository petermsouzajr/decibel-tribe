import { login } from "@/app/(auth)/login/actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);

  const result = await login(formData);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
