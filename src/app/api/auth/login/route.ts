import { login } from "@/app/(auth)/login/actions";
import { NextResponse } from "next/server";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function POST(req: any) {
  const body = await req.json();
  const { username, email, password } = body;

  // Accept either username or email field
  const usernameOrEmail = email || username;

  if (!usernameOrEmail || !password) {
    return NextResponse.json(
      { error: "Username/email and password are required" },
      { status: 400 }
    );
  }

  const formData = new FormData();
  formData.append("username", usernameOrEmail);
  formData.append("password", password);

  try {
    const result = await login(formData);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json(
      { success: true },
      { status: 200 },
    );
  } catch (error) {
    // The login action redirects on success, which throws a redirect error.
    // For API clients, we want to return a success response instead.
    if (isRedirectError(error)) {
      return NextResponse.json(
        { success: true },
        { status: 200 },
      );
    }
    
    throw error;
  }
}
