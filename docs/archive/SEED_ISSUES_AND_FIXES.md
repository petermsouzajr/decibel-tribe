# Seed File Issues and Fixes

## Issues Found

### 1. Media Not Being Deleted ✅ FIXED
- **Problem**: Media records (133,035) were accumulating because:
  - No cascade delete in schema
  - Deletion function didn't delete media before deleting posts
- **Fix**: 
  - Added `onDelete: Cascade` to Media model in schema
  - Updated `seedDeletion.ts` and `seedDeletion.mts` to delete media before deleting posts
  - Created migration `20251211002905_add_cascade_delete_to_media`

### 2. Notifications, Likes, Dislikes, Follows Not Being Created ⚠️ NEEDS INVESTIGATION
- **Problem**: These tables are empty (0 records) after seed runs
- **Root Causes**:
  1. **Filtering Logic**: Seed functions filter users/posts:
     - `seedPublicPosts`: Filters for `isVerified && !username.includes("noPosts")`
     - `seedFollows`: Filters for `isVerified && !username.includes("noFollowers")`
     - If all users are filtered out, no data is created
  
  2. **Empty Arrays**: If `seedPublicPosts` or `seedGroupPosts` return empty arrays:
     - `seedLikesDislikes` has no posts to create likes/dislikes for
     - `seedNotifications` has no data to create notifications for
  
  3. **Dependencies**: Functions depend on previous functions:
     - `seedLikesDislikes` needs posts
     - `seedNotifications` needs likes, dislikes, follows, comments, events
     - If any dependency is empty, downstream functions create nothing

- **Potential Issues**:
  - Users might not be verified (check `isVerified` flag)
  - Users might have "noPosts" or "noFollowers" in username (expected filtering)
  - Groups might not have accepted members (required for group posts)
  - `accountDataGenerator` might return 0 (unlikely but possible)

### 3. Posts with Invalid Authors ⚠️ NEEDS CLEANUP
- **Problem**: Only 2 of 51 posts have valid authors
- **Cause**: Posts reference deleted users (likely from previous seed runs)
- **Solution**: These orphaned posts should be cleaned up, but they don't affect seed execution

## Debugging Steps

1. **Check Seed Logs**: Added logging to `seed.ts` to track:
   - Number of public posts created
   - Number of group posts created
   - Number of follows created
   - Number of likes/dislikes created
   - Notification seeding completion

2. **Run Seed and Check Output**: 
   ```bash
   npm run db:seed
   ```
   Look for:
   - "Created X public posts"
   - "Created X follows"
   - "Created X likes and X dislikes"
   - "Notifications seeding completed"

3. **Check User Creation**:
   - Verify users are being created as `isVerified: true`
   - Check if usernames contain "noPosts" or "noFollowers"
   - Verify users have `@cypress.test` email domain

4. **Check Post Creation**:
   - Verify posts are being created for verified users
   - Check if group posts require accepted members

## Recommendations

1. **Run Seed Again**: The added logging will help identify where the process fails
2. **Check cypress.env.json**: Ensure it has valid usernames for test users
3. **Verify User Verification**: Ensure users are created as verified (unless intentionally unverified)
4. **Clean Orphaned Data**: Consider cleaning up posts with invalid authors

## Files Modified

1. `prisma/schema.prisma` - Added cascade delete to Media model
2. `prisma/seedDeletion.ts` - Added media deletion before post deletion
3. `prisma/seedDeletion.mts` - Added media deletion before post deletion
4. `prisma/migrations/20251211002905_add_cascade_delete_to_media/migration.sql` - Migration for cascade delete
5. `prisma/seed.ts` - Added logging for debugging
