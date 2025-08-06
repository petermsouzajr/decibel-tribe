import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { isActive } = await request.json();

    // Update the user's dating active status
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isDatingActive: isActive,
      },
      select: {
        id: true,
        isDatingActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      isDatingActive: updatedUser.isDatingActive,
    });
  } catch (error) {
    console.error("Error toggling dating feature:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 