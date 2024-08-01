import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") || "";

    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (typeof q !== "string") {
      throw new Error("Invalid query");
    }

    const searchQuery = q.split(" ").join(" & ");

    // Fetch posts
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          {
            content: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            user: {
              displayName: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              username: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      include: getPostDataInclude(user.id),
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
    });

    // Fetch users with skills
    const usersWithSkills = await prisma.user.findMany({
      where: {
        userSkills: {
          some: {
            skill: {
              name: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        },
      },
      take: pageSize + 1,
    });

    // Fetch users with instruments
    const usersWithInstruments = await prisma.user.findMany({
      where: {
        userInstruments: {
          some: {
            instrument: {
              name: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        },
      },
      take: pageSize + 1,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;
    return Response.json({
      posts: posts.slice(0, pageSize),
      usersWithSkills: usersWithSkills.slice(0, pageSize),
      usersWithInstruments: usersWithInstruments.slice(0, pageSize),
      nextCursor,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
