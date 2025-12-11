# Media Cleanup Guide

## Current Situation

### Orphaned Media Statistics
- **Total orphaned media**: 132,773 records with `postId: null`
- **Media with valid postId**: 1,593 records
- **Media with invalid postId references**: 0 records

### Why Orphaned Media Exists

Orphaned media (media with `postId: null`) can occur when:

1. **User uploads media but doesn't finish creating post**
   - User starts creating a post, uploads media
   - User closes browser or navigates away before submitting
   - Media record is created but never attached to a post

2. **Post creation fails after media upload**
   - Media is uploaded successfully
   - Post creation fails due to validation error or server error
   - Media record exists but post doesn't

3. **Historical data from before cascade delete**
   - Posts were deleted manually before cascade delete was implemented
   - Media records were left behind

## Automatic Cleanup Mechanisms

### 1. Cascade Delete (✅ Already Implemented)

**Schema Configuration:**
```prisma
model Media {
  post Post? @relation(fields: [postId], references: [id], onDelete: Cascade)
}
```

**How it works:**
- When a post is deleted (via `prisma.post.delete()` or `prisma.post.deleteMany()`), all associated media is automatically deleted
- This happens at the database level via foreign key constraints
- **No code changes needed** - it's automatic!

**Where it applies:**
- ✅ Post deletion API (`/api/posts/[postId]/route.ts`)
- ✅ Seed file deletion (`seedDeletion.ts`)
- ✅ Any other post deletion operations

### 2. Seed File Cleanup (✅ Just Added)

**Location:** `prisma/seedDeletion.ts` and `prisma/seedDeletion.mts`

**What it does:**
- During seed file execution, after deleting posts, it also cleans up orphaned media
- Only deletes orphaned media older than 1 hour (to avoid deleting recent uploads)
- Logs how many orphaned media records were deleted

**Code:**
```typescript
// Clean up orphaned media (media with postId: null) that are older than 1 hour
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const orphanedMediaCount = await prismaClient.media.deleteMany({
  where: {
    postId: null,
    createdAt: {
      lte: oneHourAgo,
    },
  },
});
```

### 3. Scheduled Cleanup Endpoint (✅ Already Exists)

**Location:** `/api/clear-uploads/route.ts`

**What it does:**
- Cleans up orphaned media via cron job
- In production: Only deletes media older than 24 hours
- In development: Deletes all orphaned media
- Also deletes files from UploadThing storage

**Usage:**
- Set up a cron job to call: `GET /api/clear-uploads`
- Requires `Authorization: Bearer ${CRON_SECRET}` header

## Manual Cleanup Script

### Cleanup Script (✅ Just Created)

**Location:** `scripts/cleanup-orphaned-media.ts`

**Usage:**

```bash
# Delete orphaned media older than 24 hours (default)
npx tsx scripts/cleanup-orphaned-media.ts

# Delete orphaned media older than specified hours
npx tsx scripts/cleanup-orphaned-media.ts --older-than-hours=48

# Delete ALL orphaned media (use with caution!)
npx tsx scripts/cleanup-orphaned-media.ts --all
```

**What it does:**
- Finds all orphaned media (`postId: null`)
- Optionally filters by age (default: 24 hours)
- Deletes the records
- Shows summary of what was deleted

## Recommendations

### For Immediate Cleanup

Run the cleanup script to remove existing orphaned media:

```bash
# Safe: Delete orphaned media older than 24 hours
npx tsx scripts/cleanup-orphaned-media.ts

# Or delete all orphaned media (if you're sure)
npx tsx scripts/cleanup-orphaned-media.ts --all
```

### For Ongoing Maintenance

1. **Cascade delete handles future cases automatically** ✅
   - No code changes needed
   - Works for all post deletions

2. **Seed file cleanup runs automatically** ✅
   - Runs every time seed file executes
   - Cleans up orphaned media older than 1 hour

3. **Set up scheduled cleanup** (Optional)
   - Configure cron job to call `/api/clear-uploads` daily
   - Cleans up orphaned media and UploadThing files

### Prevention

To prevent future orphaned media:

1. **Client-side cleanup**: Consider cleaning up media if post creation fails
2. **Upload timeout**: Set a timeout for media uploads that aren't attached to posts
3. **Validation**: Ensure media is only created when post creation succeeds

## Summary

| Mechanism | Status | When It Runs | What It Cleans |
|-----------|--------|--------------|----------------|
| Cascade Delete | ✅ Active | On post deletion | Media with valid postId |
| Seed Cleanup | ✅ Active | During seed execution | Orphaned media > 1 hour old |
| Scheduled Cleanup | ✅ Available | Via cron job | Orphaned media > 24 hours |
| Manual Script | ✅ Available | On-demand | Configurable age filter |

## Next Steps

1. ✅ Cascade delete is already working - no action needed
2. ✅ Seed file cleanup is added - will run automatically
3. ⚠️ Run manual cleanup script to remove existing 132,773 orphaned records
4. ⚠️ (Optional) Set up cron job for `/api/clear-uploads` endpoint
