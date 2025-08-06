import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect, UserData } from "@/lib/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import UserProfilePage from "./UserProfilePage";

interface PageProps {
  params: { username: string };
}

const getUser = cache(
  async (
    username: string,
    loggedInUserId: string,
  ): Promise<UserData> => {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
        deletedAt: null, // Filter out deleted users
      },
      select: {
        ...getUserDataSelect(loggedInUserId),
      },
    });

    if (!user) notFound();

    return user as any;
  },
);

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

  const followerInfo = {
    followers: user._count.followers,
    isFollowedByUser: (user as any).followers?.some(
      ({ followerId }: { followerId: string }) => followerId === loggedInUser.id,
    ) ?? false,
  };

  return (
    <UserProfilePage
      user={user}
      loggedInUserId={loggedInUser.id}
      followerInfo={followerInfo}
    />
  );
}
