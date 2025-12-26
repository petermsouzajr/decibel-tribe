import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import FollowButton from "./FollowButton";
import UserAvatar from "./UserAvatar";
import { format } from "date-fns";
import HelpWantedZipEditor from "@/components/helpWanted/HelpWantedZipEditor";

export default function TrendsSidebar() {
  return (
    <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <WhoToFollow />
        <HelpWanted />
      </Suspense>
    </div>
  );
}

async function WhoToFollow() {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) return null;

  // --- Personalized suggestions ---
  // Strong signals: shared instruments/skills, event overlap, group overlap, mutual follows.
  const [
    mySkills,
    myInstruments,
    myGroupMemberships,
    myEventAttendances,
    myFollowing,
  ] = await Promise.all([
    prisma.userSkill.findMany({
      where: { userId: loggedInUser.id },
      select: { skillId: true },
    }),
    prisma.userInstrument.findMany({
      where: { userId: loggedInUser.id },
      select: { instrumentId: true },
    }),
    prisma.groupMember.findMany({
      where: { userId: loggedInUser.id },
      select: { groupId: true },
    }),
    prisma.eventAttendee.findMany({
      where: { userId: loggedInUser.id },
      select: { eventId: true },
    }),
    prisma.follow.findMany({
      where: { followerId: loggedInUser.id },
      select: { followingId: true },
      take: 500,
    }),
  ]);

  const mySkillIds = mySkills.map((s) => s.skillId);
  const myInstrumentIds = myInstruments.map((i) => i.instrumentId);
  const myGroupIds = myGroupMemberships.map((g) => g.groupId);
  const myEventIds = myEventAttendances.map((e) => e.eventId);
  const myFollowingIds = myFollowing.map((f) => f.followingId);

  // Mutual connections: "followed by people you follow"
  const mutualFollows = myFollowingIds.length
    ? await prisma.follow.findMany({
        where: { followerId: { in: myFollowingIds } },
        select: { followingId: true },
        take: 1500,
      })
    : [];
  const mutualCountByUserId = new Map<string, number>();
  for (const f of mutualFollows) {
    mutualCountByUserId.set(f.followingId, (mutualCountByUserId.get(f.followingId) ?? 0) + 1);
  }
  // Cap for the DB IN filter
  const mutualIds = Array.from(mutualCountByUserId.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 300)
    .map(([id]) => id);

  const hasSignals =
    mySkillIds.length > 0 ||
    myInstrumentIds.length > 0 ||
    myGroupIds.length > 0 ||
    myEventIds.length > 0 ||
    mutualIds.length > 0;

  const userSelect = {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    bio: true,
    followers: {
      where: { followerId: loggedInUser.id },
      select: { followerId: true },
    },
    userInstruments: { select: { instrumentId: true } },
    userSkills: { select: { skillId: true } },
    groups: { select: { groupId: true } },
    EventAttendee: { select: { eventId: true } },
    _count: { select: { followers: true } },
  } as const;

  const baseWhere = {
    NOT: { id: loggedInUser.id },
    deletedAt: null,
    followers: { none: { followerId: loggedInUser.id } },
  } as const;

  const candidateWhere = hasSignals
    ? {
        ...baseWhere,
        OR: [
          ...(myInstrumentIds.length > 0
            ? [{ userInstruments: { some: { instrumentId: { in: myInstrumentIds } } } }]
            : []),
          ...(mySkillIds.length > 0
            ? [{ userSkills: { some: { skillId: { in: mySkillIds } } } }]
            : []),
          ...(myGroupIds.length > 0
            ? [{ groups: { some: { groupId: { in: myGroupIds } } } }]
            : []),
          ...(myEventIds.length > 0
            ? [{ EventAttendee: { some: { eventId: { in: myEventIds } } } }]
            : []),
          ...(mutualIds.length > 0 ? [{ id: { in: mutualIds } }] : []),
        ],
      }
    : baseWhere;

  const candidates = await prisma.user.findMany({
    where: candidateWhere as any,
    select: userSelect as any,
    take: 80,
  });

  const mySkillSet = new Set(mySkillIds);
  const myInstrumentSet = new Set(myInstrumentIds);
  const myGroupSet = new Set(myGroupIds);
  const myEventSet = new Set(myEventIds);

  const scored = candidates
    .filter((u: any) => !!u?.id && !!u?.username?.trim() && !!u?.displayName?.trim())
    .map((u: any) => {
      const overlapSkills = (u.userSkills ?? []).filter((x: any) => mySkillSet.has(x.skillId)).length;
      const overlapInstruments = (u.userInstruments ?? []).filter((x: any) => myInstrumentSet.has(x.instrumentId)).length;
      const overlapGroups = (u.groups ?? []).filter((x: any) => myGroupSet.has(x.groupId)).length;
      const overlapEvents = (u.EventAttendee ?? []).filter((x: any) => myEventSet.has(x.eventId)).length;
      const mutual = mutualCountByUserId.get(u.id) ?? 0;

      // Weighted score (shared instruments/skills strongest, then events/groups, then mutuals)
      const score =
        overlapInstruments * 6 +
        overlapSkills * 5 +
        overlapEvents * 4 +
        overlapGroups * 3 +
        mutual * 2;

      return { user: u, score };
    })
    .sort((a, b) => b.score - a.score);

  let usersToFollow = scored.slice(0, 5).map((x) => x.user);

  // Fallback: if the user has no profile signals yet (or query yields 0),
  // show a small "popular/recent" list so the module isn't empty.
  if (usersToFollow.length === 0) {
    const fallback = await prisma.user.findMany({
      where: baseWhere as any,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        followers: {
          where: { followerId: loggedInUser.id },
          select: { followerId: true },
        },
        _count: { select: { followers: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 25,
    });

    usersToFollow = (fallback as any[])
      .filter((u) => !!u?.id && !!u?.username?.trim() && !!u?.displayName?.trim())
      .slice(0, 5);
  }

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Who to follow</div>
      {usersToFollow.map((user) => (
        <div key={user.id} className="flex items-center justify-between gap-3">
          {/* Stable “tooltip”: CSS-only hover card (server-rendered, no hydration risk). */}
          <div className="group relative flex items-center gap-3">
            <Link href={`/users/${user.username}`} className="flex items-center gap-3">
              <UserAvatar avatarUrl={user.avatarUrl} className="flex-none" />
              <div>
                <p className="line-clamp-1 break-all font-semibold hover:underline">
                  {user.displayName}
                </p>
                <p className="line-clamp-1 break-all text-muted-foreground">
                  @{user.username}
                </p>
              </div>
            </Link>

            {/* Hover card */}
            <div className="pointer-events-none absolute left-0 top-full z-50 hidden w-72 translate-y-2 rounded-md border bg-popover p-3 text-popover-foreground shadow-md group-hover:block">
              <div className="flex items-start gap-3">
                <UserAvatar avatarUrl={user.avatarUrl} size={48} className="flex-none" />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{user.displayName}</div>
                  <div className="truncate text-sm text-muted-foreground">@{user.username}</div>
                </div>
              </div>
              {user.bio ? (
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
                  {user.bio}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Followers: {user._count.followers}
              </p>
            </div>
          </div>
          <FollowButton
            userId={user.id}
            initialState={{
              followers: user._count.followers,
              isFollowedByUser: user.followers.some(
                ({ followerId }: { followerId: string }) =>
                  followerId === loggedInUser.id,
              ),
            }}
          />
        </div>
      ))}
    </div>
  );
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function HelpWanted() {
  const { user: loggedInUser } = await validateRequest();
  if (!loggedInUser) return null;

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: loggedInUser.id },
    select: { zipCode: true, latitude: true, longitude: true },
  });

  const userSkills = await prisma.userSkill.findMany({
    where: { userId: loggedInUser.id },
    select: { skillId: true },
  });

  // Only show module when the user has a (private) zip code + at least one skill
  if (!prefs?.zipCode || userSkills.length === 0) return null;

  const viewerLat = typeof prefs.latitude === "number" ? prefs.latitude : null;
  const viewerLon = typeof prefs.longitude === "number" ? prefs.longitude : null;
  if (viewerLat === null || viewerLon === null) return null;

  const skillIds = userSkills.map((s) => s.skillId);

  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isCancelled: false,
      latitude: { not: null },
      longitude: { not: null },
      helpWantedSkills: {
        some: {
          skillId: { in: skillIds },
        },
      },
    },
    orderBy: { when: "asc" },
    take: 50,
    include: {
      createdBy: { select: { username: true } },
      helpWantedSkills: { select: { skill: { select: { name: true } } } },
    },
  });

  const withDistance = events
    .map((e: any) => {
      const lat = e.latitude as number | null;
      const lon = e.longitude as number | null;
      if (lat == null || lon == null) return null;
      const distanceKm = haversineKm(viewerLat, viewerLon, lat, lon);
      return { event: e, distanceKm };
    })
    .filter(Boolean) as Array<{ event: any; distanceKm: number }>;

  // Prioritize proximity ONLY (closest first), regardless of how many skills match
  withDistance.sort((a, b) => a.distanceKm - b.distanceKm);

  const top = withDistance.slice(0, 5);
  if (top.length === 0) return null;

  return (
    <div className="space-y-4 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold">
          <HelpWantedZipEditor zipCode={prefs.zipCode} />
        </div>
      </div>

      <div className="space-y-4">
        {top.map(({ event, distanceKm }) => {
          const skills = Array.isArray(event.helpWantedSkills)
            ? event.helpWantedSkills
                .map((h: any) => h?.skill?.name)
                .filter(Boolean)
            : [];

          const miles = distanceKm * 0.621371;
          const title =
            typeof event.title === "string" && event.title.trim().length > 0
              ? event.title.trim()
              : Array.isArray(event.performers) &&
                  typeof event.performers[0] === "string" &&
                  event.performers[0].trim().length > 0
                ? event.performers[0].trim()
                : typeof event.createdBy?.username === "string" &&
                    event.createdBy.username.trim().length > 0
                  ? `@${event.createdBy.username.trim()}`
                  : "Event";

          return (
            <Link key={event.id} href={`/events/${event.id}`} className="block">
              <div className="rounded-xl border bg-background p-3 hover:bg-muted/50 transition-colors text-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="line-clamp-1 font-semibold hover:underline">
                      {title}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {format(new Date(event.when), "MMM d")} • {event.location}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-xs font-semibold text-muted-foreground">
                    {miles.toFixed(1)} mi
                  </div>
                </div>People they need:

                {skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {skills.slice(0, 6).map((s: string) => (
                      <span
                        key={s}
                        className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
