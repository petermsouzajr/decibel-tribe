import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { createUploadthing, FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import crypto from "crypto";

const f = createUploadthing();

export const fileRouter = {
  avatar: f({
    image: { maxFileSize: "512KB" },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      return { user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const isDev = process.env.NODE_ENV === "development";
      if (isDev) {
        console.log("UploadThing avatar onUploadComplete called with file:", file);
      }
      
      if (!file.url) {
        console.error("UploadThing error: file.url is undefined for avatar");
        throw new UploadThingError("Avatar upload failed - no URL returned");
      }

      const oldAvatarUrl = metadata.user.avatarUrl;

      if (oldAvatarUrl) {
        const key = oldAvatarUrl.split(
          `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
        )[1];

        await new UTApi().deleteFiles(key);
      }

      const newAvatarUrl = file.url.replace(
        "/f/",
        `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
      );

      await Promise.all([
        prisma.user.update({
          where: { id: metadata.user.id },
          data: {
            avatarUrl: newAvatarUrl,
          },
        }),
        streamServerClient.partialUpdateUser({
          id: metadata.user.id,
          set: {
            image: newAvatarUrl,
          },
        }),
      ]);

      if (isDev) {
        console.log("Avatar updated successfully:", newAvatarUrl);
      }
      return { avatarUrl: newAvatarUrl };
    }),
  attachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      return {};
    })
    .onUploadComplete(async ({ file }) => {
      const isDev = process.env.NODE_ENV === "development";
      if (isDev) {
        console.log("UploadThing onUploadComplete called with file:", file);
      }
      
      if (!file.url) {
        console.error("UploadThing error: file.url is undefined");
        throw new UploadThingError("File upload failed - no URL returned");
      }

      const media = await prisma.media.create({
        data: {
          url: file.url.replace(
            "/f/",
            `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
          ),
          type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
        },
      });

      if (isDev) {
        console.log("Media created with ID:", media.id);
      }
      return { mediaId: media.id };
    }),
  datingPhoto: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      // Check photo count limit
      const photoCount = await prisma.user_photos.count({
        where: { userId: user.id },
      });

      if (photoCount >= 5) {
        throw new UploadThingError("Maximum 5 photos allowed");
      }

      return { user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const isDev = process.env.NODE_ENV === "development";
      if (isDev) {
        console.log("UploadThing datingPhoto onUploadComplete called with file:", file);
      }
      
      if (!file.url) {
        console.error("UploadThing error: file.url is undefined for dating photo");
        throw new UploadThingError("Photo upload failed - no URL returned");
      }

      const photoUrl = file.url.replace(
        "/f/",
        `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
      );

      // Check if this is the first photo (make it primary)
      const photoCount = await prisma.user_photos.count({
        where: { userId: metadata.user.id },
      });

      const photo = await prisma.user_photos.create({
        data: {
          id: crypto.randomUUID(),
          userId: metadata.user.id,
          url: photoUrl,
          isPrimary: photoCount === 0,
          createdAt: new Date(),
        },
      });

      return { photoId: photo.id, photoUrl };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
