import { validateRequestWithCookieMutation } from "@/auth";
import { StreamChat } from "stream-chat";
import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";

// Opt out of static generation
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequestWithCookieMutation();
    if (!user) {
      return unauthorized();
    }

    const streamClient = StreamChat.getInstance(
      process.env.NEXT_PUBLIC_STREAM_KEY!,
      process.env.STREAM_SECRET!,
    );

    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60;

    const token = streamClient.createToken(user.id, expirationTime);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error getting Stream token:", error);
    return serverError();
  }
}
