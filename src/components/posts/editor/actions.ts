"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostData } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";

export async function submitPost(input: {
  content: string;
  mediaIds: string[];
  groupId?: string;
  sharedFromId?: string;
}): Promise<PostData> {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const { content, mediaIds } = createPostSchema.parse(input);

  const newPost = await prisma.post.create({
    data: {
      content,
      userId: user.id,
      sharedFromId: input.sharedFromId ?? null,
      attachments: {
        connect: mediaIds.map((id) => ({ id })),
      },
      ...(input.groupId && { groupId: input.groupId }),
    },
    include: getPostDataInclude(user.id),
  });

  // If this is a share chain, increment sharedCount up the chain
  if (input.sharedFromId) {
    // increment direct parent
    await prisma.post.update({ where: { id: input.sharedFromId }, data: { sharedCount: { increment: 1 } } });
    // increment root if exists
    const parent = await prisma.post.findUnique({ where: { id: input.sharedFromId }, select: { sharedFromId: true } });
    if (parent?.sharedFromId) {
      await prisma.post.update({ where: { id: parent.sharedFromId }, data: { sharedCount: { increment: 1 } } });
    }
  }

  return newPost as unknown as PostData;
}
