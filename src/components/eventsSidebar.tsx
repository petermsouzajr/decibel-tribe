import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect, UserData } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import UserAvatar from "./UserAvatar";
import UserTooltip from "./UserTooltip";
import { format } from "date-fns";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { useSession } from "../app/(main)/SessionProvider";

export default function EventsSidebar({
  user,
  loggedInUser,
}: {
  user: UserData;
  loggedInUser: UserData;
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

// Function to fetch and display events
export async function EventsList({
  user,
  loggedInUser,
}: {
  user: UserData;
  loggedInUser: UserData;
}) {
  console.log("EventsList USER", user);
  console.log("EventsList LOGGED IN USER", loggedInUser);
  if (!user.id) return null;

  const events = await prisma.event.findMany({
    where: {
      isCancelled: false,
      // Case 1: If the loggedInUser is the event creator, show all events
      ...(loggedInUser.id === user.id
        ? {
            createdById: user.id, // Show all events for the logged-in user
          }
        : {
            // Case 2: If loggedInUser is NOT the event creator, show only PUBLIC and PUBLISHED events
            createdById: user.id,
            status: "PUBLISHED",
            visibility: "PUBLIC",
          }),
    },
    orderBy: {
      when: "asc", // Order events by date
    },
  });

  if (events.length === 0) return null;

  const currentDate = new Date();
  const groupedEvents = events.reduce(
    (acc, event) => {
      if (!event.when) return acc; // Skip events without a date
      const eventDate = new Date(event.when);
      if (isNaN(eventDate.getTime())) return acc; // Skip invalid dates

      if (eventDate < currentDate) return acc;

      const eventMonth = format(eventDate, "MMMM yyyy");
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
      ); // Grey circle for Draft    // if (event.status === "PUBLISHED" && event.visibility === "PUBLIC")
    // return "bg-blue-500"; // Blue for Public and Published
    // if (event.status === "PUBLISHED" && event.visibility === "PRIVATE")
    // return "bg-green-500"; // Green for Published
    if (event.visibility === "PRIVATE")
      return (
        <span
          className="inline-block h-3 w-3 rounded-full bg-red-500"
          title="Private"
        ></span>
      ); // Red circle for Private    // return "text-gray-400"; // Default to Grey if no status
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
                  {getStatusColor(event)}{" "}
                  {format(new Date(event.when), "MMMM d")} -{" "}
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

// Function to fetch and display the user's most engaged posts
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
