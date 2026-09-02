import { serverError } from "@/lib/api/responses";
import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server"; // Import NextResponse

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ username: string }> },
) {
  const params = await props.params;
  try {
    // Optional auth: an anonymous viewer is valid here, they just get the
    // public shape of the profile.
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    const loggedInUserId = loggedInUser?.id ?? null;

    // Perform database query using the determined loggedInUserId (null if no valid session)
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: getUserDataSelect(loggedInUserId), // Pass null or the user ID
    });

    // Check if user was found
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // User found, return data
    return NextResponse.json(user);
  } catch (error) {
    // Catch errors from database query or unexpected issues
    console.error("Error in GET /api/users/username/[username]:", error);
    return serverError();
  }
}
