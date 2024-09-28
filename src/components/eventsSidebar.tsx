import prisma from "@/lib/prisma";
import { LoggedInUser, UserData } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { format } from "date-fns";
import { Button } from "./ui/button";

export default function EventsSidebar({
  user,
  loggedInUser,
}: {
  user: UserData;
  loggedInUser: LoggedInUser;
}) {
  return (
    <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <EventsList user={user} loggedInUser={loggedInUser} />
        <MostEngagedPosts user={user} />
      </Suspense>
    </div>
  );
}

export async function EventsList({
  user,
  loggedInUser,
}: {
  user: UserData;
  loggedInUser: LoggedInUser;
}) {
  if (!user.id) return null;

  const events = await prisma.event.findMany({
    where: {
      isCancelled: false,
      ...(loggedInUser.id === user.id
        ? {
            createdById: user.id,
          }
        : {
            createdById: user.id,
            status: "PUBLISHED",
            visibility: "PUBLIC",
          }),
    },
    orderBy: {
      when: "asc",
    },
  });

  if (events.length === 0) return null;

  const currentDate = new Date(new Date().setHours(0, 0, 0, 0));
  const groupedEvents = events.reduce(
    (acc, event) => {
      if (!event.when) return acc;

      if (event.when < currentDate) return acc;

      const eventMonth = format(event.when, "MMMM yyyy");
      if (!acc[eventMonth]) acc[eventMonth] = [];
      acc[eventMonth].push(event);

      return acc;
    },
    {} as Record<string, typeof events>,
  );

  const months = Object.keys(groupedEvents);

  const getStatusColor = (event: { status: string; visibility: string }) => {
    if (event.status === "DRAFT")
      return (
        <span
          className="inline-block h-3 w-3 rounded-full bg-gray-400"
          title="Draft"
        ></span>
      );
    if (event.visibility === "PRIVATE")
      return (
        <span
          className="inline-block h-3 w-3 rounded-full bg-red-500"
          title="Private"
        ></span>
      );
  };

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Events</div>
      {months.map((month) => (
        <div key={month}>
          <h1 className="text-lg font-bold">{month}</h1>
          <ul>
            {groupedEvents[month].map((event) => (
              <li key={event.id} className="my-2">
                <Link href={`/events/${event.id}`} className="hover:underline">
                  {getStatusColor(event)} {format(event.when, "MMMM d")} -{" "}
                  {event.title || event.location}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <span className="flex justify-end">
        <Button>
          <Link href={`/calendar?user=${user.username}`} passHref>
            View Calendar
          </Link>
        </Button>
      </span>
    </div>
  );
}

const getMostEngagedPosts = unstable_cache(
  async (userId: string) => {
    const posts = await prisma.post.findMany({
      where: {
        userId,
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            dislikes: true,
          },
        },
      },
      orderBy: [
        {
          likes: {
            _count: "desc",
          },
        },
        {
          comments: {
            _count: "desc",
          },
        },
        {
          dislikes: {
            _count: "desc",
          },
        },
      ],
      take: 5,
    });

    return posts;
  },
  ["most_engaged_posts"],
  {
    revalidate: 3 * 60 * 60,
  },
);

async function MostEngagedPosts({ user }: { user: any }) {
  if (!user) return null;

  const posts = await getMostEngagedPosts(user.id);
  if (posts.length === 0) return null;

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Activity</div>
      {posts.map((post) => (
        <Link key={post.id} href={`/posts/${post.id}`} className="block">
          <p className="line-clamp-1 break-all font-semibold hover:underline">
            {post.content}
          </p>
          <p className="text-sm text-muted-foreground">
            {post._count.likes} likes, {post._count.comments} comments,{" "}
            {post._count.dislikes} dislikes
          </p>
        </Link>
      ))}
    </div>
  );
}
