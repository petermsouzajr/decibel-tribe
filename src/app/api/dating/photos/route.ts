import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const MAX_PHOTOS = 5;
const MIN_PHOTOS = 0;

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's dating photos
    const photos = await prisma.userDatingPhoto.findMany({
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

    const result = await prisma.$transaction(async (tx) => {
      const currentPhotoCount = await tx.userDatingPhoto.count({
        where: { userId: user.id },
      });

      if (currentPhotoCount >= MAX_PHOTOS) {
        throw new Error("MAX_PHOTOS");
      }

      const wasReactivated = currentPhotoCount === 0;

      const photo = await tx.userDatingPhoto.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          url,
          isPrimary: wasReactivated,
          createdAt: new Date(),
        },
      });

      if (wasReactivated) {
        await tx.user.update({
          where: { id: user.id },
          data: { isDatingActive: true },
        });
      }

      const identity = await tx.userDatingIdentityVerification.findUnique({
        where: { userId: user.id },
        select: { isIDVerified: true, verifiedAt: true },
      });

      const verifiedAt = identity?.isIDVerified ? identity.verifiedAt : null;
      let needsReverification = !verifiedAt;
      if (verifiedAt) {
        const verifiedEraCount = await tx.userDatingPhoto.count({
          where: { userId: user.id, createdAt: { lte: verifiedAt } },
        });
        needsReverification = verifiedEraCount === 0;
      }

      return { photo, reactivated: wasReactivated, needsReverification };
    });

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "MAX_PHOTOS") {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS} photos allowed` },
        { status: 400 },
      );
    }
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
    const photo = await prisma.userDatingPhoto.findUnique({
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
      await prisma.userDatingPhoto.updateMany({
        where: {
          userId: user.id,
          id: { not: photoId },
        },
        data: { isPrimary: false },
      });
    }

    // Update photo
    const updatedPhoto = await prisma.userDatingPhoto.update({
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
    const photo = await prisma.userDatingPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.userId !== user.id) {
      return NextResponse.json(
        { error: "Photo not found or unauthorized" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Use UserDatingIdentityVerification.verifiedAt as the source of truth (no per-photo verifiedAt)
      const identity = await tx.userDatingIdentityVerification.findUnique({
        where: { userId: user.id },
        select: { isIDVerified: true, verifiedAt: true },
      });
      const verifiedAt = identity?.isIDVerified ? identity.verifiedAt : null;

      const deletingPrimary = photo.isPrimary === true;

      await tx.userDatingPhoto.delete({
        where: { id: photoId },
      });

      // If deleting primary photo, set another as primary (if any remain)
      if (deletingPrimary) {
        const nextPhoto = await tx.userDatingPhoto.findFirst({
          where: { userId: user.id },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        });

        if (nextPhoto) {
          await tx.userDatingPhoto.update({
            where: { id: nextPhoto.id },
            data: { isPrimary: true },
          });
        }
      }

      const remainingPhotos = await tx.userDatingPhoto.count({
        where: { userId: user.id },
      });

      // Clear dating identity verification if there are no remaining "verified-era" photos
      // (i.e., no remaining photos with createdAt <= verifiedAt)
      let verificationCleared = false;
      if (verifiedAt) {
        const remainingVerifiedEra = await tx.userDatingPhoto.count({
          where: {
            userId: user.id,
            createdAt: { lte: verifiedAt },
          },
        });
        if (remainingVerifiedEra === 0) {
          await tx.userDatingIdentityVerification.updateMany({
            where: { userId: user.id },
            data: {
              isIDVerified: false,
              verifiedAt: null,
              verificationStatus: "not_started",
            },
          });
          verificationCleared = true;
        }
      }

      // If user has zero photos, disable dating visibility/matching (they won't appear in decks)
      let datingDeactivated = false;
      if (remainingPhotos === 0) {
        await tx.user.update({
          where: { id: user.id },
          data: { isDatingActive: false },
        });
        datingDeactivated = true;

        // Always clear identity verification when there are no photos
        await tx.userDatingIdentityVerification.updateMany({
          where: { userId: user.id },
          data: {
            isIDVerified: false,
            verifiedAt: null,
            verificationStatus: "not_started",
          },
        });
        verificationCleared = true;
      }

      return { remainingPhotos, datingDeactivated, verificationCleared };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.startsWith("MIN_PHOTOS:")) {
      const min = msg.split(":")[1] ?? String(MIN_PHOTOS);
      return NextResponse.json(
        { error: `Minimum ${min} photo required for dating` },
        { status: 400 },
      );
    }
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

























