import { NextRequest, NextResponse } from "next/server";
import { serverError } from "@/lib/api/responses";
import prisma from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

// Opt out of static generation
export const dynamic = "force-dynamic";

const utapi = new UTApi();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { message: "Invalid authorization header" },
        { status: 401 },
      );
    }

    const currentDate = new Date();

    const unusedMedia = await prisma.media.findMany({
      where: {
        postId: null,
        ...(process.env.NODE_ENV === "production"
          ? {
              createdAt: {
                lte: new Date(currentDate.getTime() - 1000 * 60 * 60 * 24),
              },
            }
          : {}),
      },
      select: {
        id: true,
        url: true,
      },
    });

    if (unusedMedia.length > 0) {
      await utapi.deleteFiles(
        unusedMedia
          .map((m) => {
            const urlParts = m.url.split(
              `/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
            );
            // Basic check to handle potential inconsistencies in URL format (e.g., /f/ vs /a/)
            // A more robust regex might be better in the long run
            return urlParts.length > 1
              ? urlParts[urlParts.length - 1]
              : undefined;
          })
          .filter((key): key is string => !!key), // Filter out undefined keys
      );

      await prisma.media.deleteMany({
        where: {
          id: {
            in: unusedMedia.map((m) => m.id),
          },
        },
      });
    }

    return new Response();
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
