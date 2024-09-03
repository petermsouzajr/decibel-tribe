import { validateRequest } from "@/auth";
import FollowButton from "@/components/FollowButton";
import FollowerCount from "@/components/FollowerCount";
import Linkify from "@/components/Linkify";
import TrendsSidebar from "@/components/TrendsSidebar";
import UserAvatar from "@/components/UserAvatar";
import prisma from "@/lib/prisma";
import { FollowerInfo, getUserDataSelect, UserData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import EditProfileButton from "./EditProfileButton";
import UserPosts from "./UserPosts";
import EventsSidebar from "@/components/eventsSidebar";

interface PageProps {
  params: { username: string };
}

const getUser = cache(async (username: string, loggedInUserId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: getUserDataSelect(loggedInUserId),
  });

  if (!user) notFound();

  return user;
});

export async function generateMetadata({
  params: { username },
}: PageProps): Promise<Metadata> {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) return {};

  const user = await getUser(username, loggedInUser.id);

  return {
    title: `${user.displayName} (@${user.username})`,
  };
}

export default async function Page({ params: { username } }: PageProps) {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const user = await getUser(username, loggedInUser.id);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <UserProfile user={user} loggedInUserId={loggedInUser.id} />
        <UserPosts userId={user.id} />
      </div>
      <EventsSidebar user={user} />
    </main>
  );
}

interface UserProfileProps {
  user: UserData;
  loggedInUserId: string;
}

async function UserProfile({ user, loggedInUserId }: UserProfileProps) {
  const followerInfo: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: user.followers.some(
      ({ followerId }) => followerId === loggedInUserId,
    ),
  };

  const instruments = user.userInstruments.map((ui) => ui.instrument.name);

  const skills = user.userSkills.map((us) => us.skill.name);

  return (
    <div className="h-fit w-full space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <UserAvatar
        avatarUrl={user.avatarUrl}
        size={250}
        className="mx-auto size-full max-h-60 max-w-60 rounded-full"
      />
      <div className="flex flex-wrap gap-3 sm:flex-nowrap">
        <div className="min-w-0 flex-1">
          <div className="space-y-3">
            <div className="flex flex-col">
              <h1 className="break-words text-3xl font-bold">
                {user.displayName}
              </h1>
              <div className="break-words text-muted-foreground">
                @{user.username}
              </div>
            </div>
            <div>Member since {formatDate(user.createdAt, "MMM d, yyyy")}</div>
            <div className="flex items-center gap-3"></div>
          </div>
        </div>
        {user.id === loggedInUserId ? (
          <EditProfileButton user={user} />
        ) : (
          <FollowButton userId={user.id} initialState={followerInfo} />
        )}
      </div>
      {(instruments.length > 0 || skills.length > 0) && (
        <div className="mx-auto flex size-full justify-between rounded-2xl border-2 bg-card p-5 shadow-sm">
          {instruments.length > 0 && (
            <div className="h-full">
              <h3 className="text-lg font-semibold">Instruments</h3>
              <ul className="list-inside list-disc">
                {instruments.map((instrument, index) => (
                  <li key={index} className="text-sm">
                    {instrument}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {skills.length > 0 && (
            <div className="h-full">
              <h3 className="text-lg font-semibold">Skills</h3>
              <ul className="list-inside list-disc">
                {skills.map((skill, index) => (
                  <li key={index} className="text-sm">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {user.bio && (
        <>
          <hr />
          <Linkify>
            <div className="overflow-hidden whitespace-pre-line break-words">
              {user.bio}
            </div>
          </Linkify>
        </>
      )}
    </div>
  );
}
