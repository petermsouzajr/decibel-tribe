# UploadThing Configuration Fix

## Issue
"Missing token for uploadthing" errors when uploading images to posts or dating profile photos.

## Root Cause
UploadThing v7 (version 7.7.4) requires `UPLOADTHING_TOKEN` environment variable, but the project is using `UPLOADTHING_SECRET` (the old v6 variable name).

## Solution

### Option 1: Update Environment Variable (Recommended)

In your `.env` file, rename the variable:

Keep `NEXT_PUBLIC_UPLOADTHING_APP_ID` as is:

### Option 2: Support Both Variables (Temporary)

If you need backward compatibility, you can update `src/app/api/uploadthing/core.ts` to check for both:

```typescript
// At the top of core.ts, add this check
if (!process.env.UPLOADTHING_TOKEN && process.env.UPLOADTHING_SECRET) {
  process.env.UPLOADTHING_TOKEN = process.env.UPLOADTHING_SECRET;
}
```

However, **Option 1 is recommended** as it follows UploadThing v7 standards.

## Required Environment Variables

For UploadThing v7, you need:

1. **`UPLOADTHING_TOKEN`** (server-side, secret)
   - Get this from your UploadThing dashboard: https://uploadthing.com/dashboard
   - This replaces `UPLOADTHING_SECRET` from v6

2. **`NEXT_PUBLIC_UPLOADTHING_APP_ID`** (public, client-side)
   - Your UploadThing app ID
   - Already configured correctly: `ectxvokkiw`

## Verification

After updating the environment variable:

1. Restart your Next.js dev server
2. Try uploading an image to a post
3. Try uploading a photo in the dating profile manager
4. Try updating your profile picture

All should work without "missing token" errors.

## Why Profile Picture Update Shows No Errors But Doesn't Update

The profile picture upload might be failing silently because:
1. The upload completes but the database update fails
2. The UI doesn't refresh properly after upload
3. The avatar URL transformation is incorrect

After fixing the token issue, check:
- Browser console for any errors
- Network tab to see if the upload request succeeds
- Check if `onUploadComplete` callback in `core.ts` is being called

## Additional Notes

- UploadThing v7 automatically reads `UPLOADTHING_TOKEN` from environment variables
- No code changes needed in route handlers - they automatically use the token
- Make sure to update `.env` in all environments (development, staging, production)
