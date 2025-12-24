import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect, UserWithFollowerStatus } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import FollowButton from "./FollowButton";
import UserAvatar from "./UserAvatar";

export default function TrendsSidebar() {
  return (
    <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <WhoToFollow />
        <TrendingTopics />
      </Suspense>
    </div>
  );
}

async function WhoToFollow() {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) return null;

  // Fetch a few extra and then defensively filter in JS. This prevents rendering
  // "blank" rows if any user object is missing expected fields due to bad data
  // or unexpected serialization issues.
  const usersToFollowResult = await prisma.user.findMany({
    where: {
      NOT: {
        id: loggedInUser.id,
      },
      followers: {
        none: {
          followerId: loggedInUser.id,
        },
      },
      deletedAt: null, // Filter out deleted users
    },
    select: getUserDataSelect(loggedInUser.id),
    take: 25,
  });

  const usersToFollow = (usersToFollowResult as unknown as UserWithFollowerStatus[])
    .filter((u) => !!u?.id && !!u?.username?.trim() && !!u?.displayName?.trim())
    .slice(0, 5);

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
                ({ followerId }) => followerId === loggedInUser.id,
              ),
            }}
          />
        </div>
      ))}
    </div>
  );
}

const getTrendingTopics = unstable_cache(
  async () => {
    const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
            SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count
            FROM posts
            GROUP BY (hashtag)
            ORDER BY count DESC, hashtag ASC
            LIMIT 5
        `;

    return result.map((row) => ({
      hashtag: row.hashtag,
      count: Number(row.count),
    }));
  },
  ["trending_topics"],
  {
    revalidate: 3 * 60 * 60,
  },
);

async function TrendingTopics() {
  const trendingTopics = await getTrendingTopics();

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Trending topics</div>
      {trendingTopics.map(({ hashtag, count }) => {
        const title = hashtag.split("#")[1];

        return (
          <Link key={title} href={`/hashtag/${title}`} className="block">
            <p
              className="line-clamp-1 break-all font-semibold hover:underline"
              title={hashtag}
            >
              {hashtag}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatNumber(count)} {count === 1 ? "post" : "posts"}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
