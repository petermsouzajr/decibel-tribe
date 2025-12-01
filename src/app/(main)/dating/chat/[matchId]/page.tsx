import { validateRequest } from "@/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import DatingChatInterface from "@/components/dating/DatingChatInterface";

export default async function ChatPage({
  params,
}: {
  params: { matchId: string };
}) {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  // Check if dating is active
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isVerified: true, isDatingActive: true },
  });

  if (!currentUser?.isDatingActive) {
    redirect("/dating");
  }

  // Verify user is part of this match
  const match = await prisma.matches.findUnique({
    where: { id: params.matchId },
    include: {
      users_matches_user1IdTousers: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          user_photos: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      users_matches_user2IdTousers: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          user_photos: {
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
      ? match.users_matches_user2IdTousers
      : match.users_matches_user1IdTousers;

  return <DatingChatInterface matchId={params.matchId} otherUser={otherUser} />;
}

