import { login } from "@/app/(auth)/login/actions";
import { NextResponse } from "next/server";

export async function POST(req: any) {
  const { username, password } = await req.json();

  const result = await login({ username, password }, true);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json(
    { sessionCookie: result.sessionCookie },
    { status: 200 },
  );
}
