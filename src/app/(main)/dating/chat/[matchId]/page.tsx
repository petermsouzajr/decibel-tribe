import { validateRequest } from "@/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import DatingChatInterface from "@/components/dating/DatingChatInterface";

export default async function ChatPage(
  props: {
    params: Promise<{ matchId: string }>;
  }
) {
  const params = await props.params;
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  // session existence = email verified (login enforces this).
  if (!user.isDatingActive) {
    redirect("/dating");
  }

  // Verify user is part of this match
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: {
      user1: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          userDatingPhotos: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      user2: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          userDatingPhotos: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!match) {
    notFound();
  }

  if (match.user1Id !== user.id && match.user2Id !== user.id) {
    redirect("/dating/matches");
  }

  const otherUser =
    match.user1Id === user.id
      ? match.user2
      : match.user1;

  // Mark match as read when user views the chat
  const updateData: { user1LastViewedAt?: Date; user2LastViewedAt?: Date } = {};
  if (match.user1Id === user.id) {
    updateData.user1LastViewedAt = new Date();
  } else {
    updateData.user2LastViewedAt = new Date();
  }

  await prisma.match.update({
    where: { id: params.matchId },
    data: updateData,
  });

  return <DatingChatInterface matchId={params.matchId} otherUser={{
    ...otherUser,
    userDatingPhotos: otherUser.userDatingPhotos || [],
  }} />;
}

