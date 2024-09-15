import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    // Validate group name (e.g., uniqueness, length)
    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Group name must be at least 3 characters long." },
        { status: 400 },
      );
    }

    // Create the new group
    const newGroup = await prisma.group.create({
      data: {
        name,
        description,
        ownerId: loggedInUser.id,
        members: {
          create: {
            userId: loggedInUser.id,
            role: "ADMIN", // Owner is also an admin
            acceptedInvite: true,
          },
        },
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
