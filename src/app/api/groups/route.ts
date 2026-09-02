import { NextRequest, NextResponse } from "next/server";
import { unauthorized, serverError } from "@/lib/api/responses";
import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Direct session validation
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    // --- End direct session validation

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Group name must be at least 3 characters long." },
        { status: 400 },
      );
    }

    const newGroup = await prisma.group.create({
      data: {
        name,
        description,
        ownerId: loggedInUser.id,
        members: {
          create: {
            userId: loggedInUser.id,
            role: "ADMIN",
            acceptedInvite: true,
          },
        },
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return serverError();
  }
}
