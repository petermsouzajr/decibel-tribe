"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostData } from "@/lib/types";
import { createPostSchema } from "@/lib/validation";

export async function submitPost(input: {
  content: string;
  mediaIds: string[];
  groupId?: string;
}): Promise<PostData> {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const { content, mediaIds } = createPostSchema.parse(input);

  const newPost = await prisma.post.create({
    data: {
      content,
      userId: user.id,
      attachments: {
        connect: mediaIds.map((id) => ({ id })),
      },
      ...(input.groupId && { groupId: input.groupId }),
    },
    include: getPostDataInclude(user.id),
  });

  return newPost as PostData;
}
