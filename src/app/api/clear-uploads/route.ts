import { NextRequest, NextResponse } from "next/server";
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

    new UTApi().deleteFiles(
      unusedMedia.map(
        (m) =>
          m.url.split(`/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`)[1],
      ),
    );

    await prisma.media.deleteMany({
      where: {
        id: {
          in: unusedMedia.map((m) => m.id),
        },
      },
    });

    return new Response();
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
