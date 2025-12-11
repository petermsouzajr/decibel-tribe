# Additional Seed Functions

## Overview

Added seed functions for tables that were previously left blank after seeding:
- CommentLike
- Block
- UserInstrument
- UserSkill
- user_dating_identity_verification
- matches (additional matches beyond test users)

## New Seed Modules

### 1. Comment Likes (`seedModules/socialTeam/commentLikes.ts`)

**Purpose**: Creates likes and dislikes on comments

**Logic**:
- For each comment, randomly selects 1-10 users to like/dislike it
- Excludes the comment author
- 80% likes, 20% dislikes
- Creates records with recent timestamps (within 30 days)

**Dependencies**: Users, Comments

**Usage**:
```typescript
await seedCommentLikes(tx, createdUsers, allComments);
```

### 2. Blocks (`seedModules/socialTeam/blocks.ts`)

**Purpose**: Creates block relationships between users

**Logic**:
- 5-10% of users will block someone
- Each blocker blocks 1-3 users
- Excludes self-blocks
- Creates records with recent timestamps (within 60 days)

**Dependencies**: Users

**Usage**:
```typescript
await seedBlocks(tx, createdUsers);
```

### 3. User Instruments (`seedModules/authTeam/userInstruments.ts`)

**Purpose**: Assigns instruments to users

**Logic**:
- First ensures all instruments from `instrumentList.json` exist in database
- 60-70% of users will have instruments
- Each user has 1-5 instruments
- Randomly selects from available instruments

**Dependencies**: Users, Instruments (created if needed)

**Usage**:
```typescript
await seedUserInstruments(tx, createdUsers);
```

### 4. User Skills (`seedModules/authTeam/userSkills.ts`)

**Purpose**: Assigns skills to users

**Logic**:
- First ensures all skills from `skillsList.json` exist in database
- 50-60% of users will have skills
- Each user has 1-4 skills
- Randomly selects from available skills

**Dependencies**: Users, Skills (created if needed)

**Usage**:
```typescript
await seedUserSkills(tx, createdUsers);
```

### 5. Identity Verification (`seedModules/datingTeam/identityVerification.ts`)

**Purpose**: Creates identity verification records for dating users

**Logic**:
- Only creates for dating active users
- 30-40% of dating users will have verification records
- Randomly assigns verification status:
  - "not_started"
  - "pending"
  - "verified"
  - "failed"
  - "requires_input"
- Sets appropriate fields based on status (verifiedAt, failureReason, etc.)

**Dependencies**: Dating Users (isDatingActive: true)

**Usage**:
```typescript
await seedIdentityVerification(tx, datingUsers);
```

### 6. Additional Matches (`seedModules/datingTeam/matches.ts`)

**Purpose**: Creates additional matches beyond test user matches

**Logic**:
- Only creates for dating active users
- Creates matches for 10-15% of dating users
- Ensures no duplicate matches
- Uses consistent user ID ordering (user1Id < user2Id)
- Creates records with recent timestamps (within 30 days)

**Dependencies**: Dating Users (isDatingActive: true)

**Usage**:
```typescript
await seedMatches(tx, datingUsers);
```

## Integration in Seed File

All new seed functions are integrated into `prisma/seed.ts`:

```typescript
// After comments are created
await seedCommentLikes(tx, createdUsers, allComments);

// After reports are created
await seedBlocks(tx, createdUsers);
await seedUserInstruments(tx, createdUsers);
await seedUserSkills(tx, createdUsers);

// After dating profiles are created
const allDatingActiveUsers = await tx.user.findMany({
  where: { isDatingActive: true },
  select: { id: true, isDatingActive: true },
});
await seedMatches(tx, allDatingActiveUsers);
await seedIdentityVerification(tx, allDatingActiveUsers);
```

## Expected Results

After running the seed file, you should see:

- **Comment Likes**: ~100-500+ comment likes/dislikes (depends on number of comments)
- **Blocks**: ~10-30 blocks (depends on number of users)
- **User Instruments**: ~60-70% of users will have 1-5 instruments
- **User Skills**: ~50-60% of users will have 1-4 skills
- **Identity Verifications**: ~30-40% of dating users will have verification records
- **Matches**: ~10-15% additional matches beyond test user matches (e.g., if 200 dating users, ~20-30 additional matches)

## Notes

- All functions use `skipDuplicates: true` to handle re-runs gracefully
- Functions handle edge cases (empty arrays, insufficient data, etc.)
- Functions log their progress and results
- All functions are idempotent (safe to run multiple times)
