import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const MAX_PHOTOS = 5;
const MIN_PHOTOS = 1; // Required for verification to like

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's dating photos
    const photos = await prisma.user_photos.findMany({
      where: { userId: user.id },
      orderBy: [
        { isPrimary: "desc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "Photo URL is required" },
        { status: 400 }
      );
    }

    // Check current photo count
    const currentPhotoCount = await prisma.user_photos.count({
      where: { userId: user.id },
    });

    if (currentPhotoCount >= MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS} photos allowed` },
        { status: 400 }
      );
    }

    // If this is the first photo, make it primary
    const isFirstPhoto = currentPhotoCount === 0;

    // Create photo
    const photo = await prisma.user_photos.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        url,
        isPrimary: isFirstPhoto,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ photo });
  } catch (error) {
    console.error("Error creating photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { photoId, isPrimary } = await request.json();

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID is required" },
        { status: 400 }
      );
    }

    // Verify photo belongs to user
    const photo = await prisma.user_photos.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.userId !== user.id) {
      return NextResponse.json(
        { error: "Photo not found or unauthorized" },
        { status: 404 }
      );
    }

    // If setting as primary, unset other primary photos
    if (isPrimary === true) {
      await prisma.user_photos.updateMany({
        where: {
          userId: user.id,
          id: { not: photoId },
        },
        data: { isPrimary: false },
      });
    }

    // Update photo
    const updatedPhoto = await prisma.user_photos.update({
      where: { id: photoId },
      data: { isPrimary: isPrimary ?? photo.isPrimary },
    });

    return NextResponse.json({ photo: updatedPhoto });
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID is required" },
        { status: 400 }
      );
    }

    // Verify photo belongs to user
    const photo = await prisma.user_photos.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.userId !== user.id) {
      return NextResponse.json(
        { error: "Photo not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check current photo count
    const currentPhotoCount = await prisma.user_photos.count({
      where: { userId: user.id },
    });

    if (currentPhotoCount <= MIN_PHOTOS) {
      return NextResponse.json(
        { error: `Minimum ${MIN_PHOTOS} photo required for dating` },
        { status: 400 }
      );
    }

    // If deleting primary photo, set another as primary
    if (photo.isPrimary) {
      const nextPhoto = await prisma.user_photos.findFirst({
        where: {
          userId: user.id,
          id: { not: photoId },
        },
        orderBy: { createdAt: "asc" },
      });

      if (nextPhoto) {
        await prisma.user_photos.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        });
      }
    }

    // Delete photo
    await prisma.user_photos.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}









