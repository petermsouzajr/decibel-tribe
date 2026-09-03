import { NextRequest, NextResponse } from "next/server";
import { forbidden, serverError, unauthorized } from "@/lib/api/responses";
import { validateRequestWithCookieMutation } from "@/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createEventSchema, updateEventSchema } from "@/lib/validation";
import { geocodeZipCode } from "@/lib/server/geocodeZipCode";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("user") ?? undefined;

  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    let eventConditions: Prisma.EventWhereInput = {};
    if (username) {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userPreferences = await prisma.userPreferences.findUnique({
        where: { userId: user.id },
        select: { calendar: true },
      });

      const isCalendarPublic = userPreferences?.calendar === "PUBLIC";

      if (loggedInUser && loggedInUser.id === user?.id) {
        eventConditions = {
          createdById: user.id,
        };
      } else if (isCalendarPublic) {
        eventConditions = {
          OR: [
            {
              AND: [
                { createdById: user.id },
                { status: "PUBLISHED" },
                { visibility: "PUBLIC" },
                { isCancelled: false },
              ],
            },
            {
              AND: [
                {
                  attendees: {
                    some: {
                      userId: user.id,
                    },
                  },
                },
                { status: "PUBLISHED" },
                { visibility: "PUBLIC" },
                { isCancelled: false },
              ],
            },
          ],
        };
      } else {
        return NextResponse.json([], { status: 200 });
      }
    } else {
      eventConditions = {
        OR: [
          {
            createdById: loggedInUser?.id,
          },
          {
            attendees: {
              some: {
                userId: loggedInUser?.id,
              },
            },
            status: "PUBLISHED",
          },
        ],
      };
    }

    const events = await prisma.event.findMany({
      where: eventConditions,
      orderBy: {
        when: "asc",
      },
      include: {
        attendees: {
          where: {
            user: {
              deletedAt: null, // Filter out deleted users from attendees
            },
          },
          select: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const safeEvents = events.map((e: any) => ({
      ...e,
      zipCode: null,
      latitude: null,
      longitude: null,
    }));
    return NextResponse.json(safeEvents, { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user: loggedInUser } = await validateRequestWithCookieMutation();
    if (!loggedInUser) {
      return unauthorized();
    }

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const {
      title,
      location,
      description,
      url,
      when,
      startTime,
      endTime,
      performers,
      helpWantedSkills,
      eventZipCode,
      status,
      visibility,
      isCancelled,
    } = parsed.data;

    const wantsHelp =
      Array.isArray(helpWantedSkills) && helpWantedSkills.length > 0;

    const normalizedZip = (eventZipCode || "").trim();
    if (wantsHelp && !normalizedZip) {
      return NextResponse.json(
        { error: "Event zip code is required when you add Help Wanted skills" },
        { status: 400 },
      );
    }

    const geo = normalizedZip ? await geocodeZipCode(normalizedZip) : null;

    const newEvent = await prisma.$transaction(async (tx) => {
      const skillIds = await Promise.all(
        (Array.isArray(helpWantedSkills) ? helpWantedSkills : []).map(
          async (skillName) => {
            const skill = await tx.skill.upsert({
              where: { name: skillName },
              update: {},
              create: { name: skillName },
            });
            return skill.id;
          },
        ),
      );

      const created = await tx.event.create({
        data: {
          title: title ?? "",
          location,
          description,
          url,
          when,
          startTime,
          endTime,
          performers,
          zipCode: normalizedZip || null,
          latitude: geo?.lat ?? null,
          longitude: geo?.lon ?? null,
          status,
          visibility,
          isCancelled,
          createdBy: {
            connect: { id: loggedInUser!.id },
          },
          attendees: {
            create: {
              userId: loggedInUser!.id,
            },
          },
          helpWantedSkills: {
            create: skillIds.map((skillId) => ({ skillId })),
          },
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        ...newEvent,
        zipCode: null,
        latitude: null,
        longitude: null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", error.code);
      console.error("Prisma error message:", error.message);
      console.error("Prisma meta:", error.meta);
    } else {
      console.error("Unknown error:", error);
      console.error("Error stack:", (error as Error).stack);
    }
    return serverError();
  }
}
