-- AlterTable
ALTER TABLE "post_media" DROP CONSTRAINT IF EXISTS "post_media_postId_fkey",
ADD CONSTRAINT "post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
