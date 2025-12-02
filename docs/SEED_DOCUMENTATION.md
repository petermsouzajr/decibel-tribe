# Database Seeding Documentation

## Overview

The Decibel Tribe application uses a modular seeding system to populate the database with test data. The seed system is organized by team responsibilities, making it easy for different teams to maintain their own seed data independently.

## Quick Start

To seed the entire database with all test data:

```bash
npm run db:seed
```

This command will:
1. Build the seed script from TypeScript to JavaScript
2. Execute the seed script, which will:
   - Delete existing test users and their related data
   - Create new test data for all features in a single transaction

## Seed Process Structure

### Architecture

The seed system follows a modular architecture:

```
prisma/
├── seed.ts                    # Main orchestration script
├── seedUtils.ts              # Shared utilities (Prisma client, faker, etc.)
├── seedDeletion.ts           # Deletion functions
└── seedModules/              # Modular seed functions by team
    ├── authTeam/
    │   └── users.ts          # User seeding
    ├── socialTeam/
    │   ├── posts.ts
    │   ├── comments.ts
    │   ├── follows.ts
    │   ├── likesDislikes.ts
    │   └── bookmarks.ts
    ├── groupsTeam/
    │   ├── groups.ts
    │   ├── groupMembers.ts
    │   ├── groupPosts.ts
    │   └── groupComments.ts
    ├── eventsTeam/
    │   ├── events.ts
    │   └── eventAttendees.ts
    ├── notificationsTeam/
    │   └── notifications.ts
    ├── mediaTeam/
    │   └── media.ts
    ├── adminTeam/
    │   └── reports.ts
    └── datingTeam/
        └── datingProfiles.ts  # Dating profile seeding
```

### Execution Flow

1. **Deletion Phase** (outside transaction)
   - Deletes existing test users from the database
   - Removes users from StreamChat
   - This happens outside the main transaction to avoid long-running locks

2. **Seeding Phase** (inside transaction)
   - All seed operations run within a single Prisma transaction
   - If any operation fails, the entire transaction rolls back
   - Execution order respects dependencies:
     1. Users (required by everything)
     2. Groups & Group Members
     3. Posts (public and group posts)
     4. Comments
     5. Events & Event Attendees
     6. Follows
     7. Likes/Dislikes
     8. Bookmarks
     9. Media
     10. Notifications
     11. Reports
     12. Dating Profiles

## Seed Modules

### Auth Team - Users (`seedModules/authTeam/users.ts`)

Creates test users based on `cypress.env.json` configuration:
- Creates users with various verification states
- Sets up Google login users
- Creates users with/without avatars and bios
- Syncs users to StreamChat

**Dependencies:** None (runs first)

**Returns:** Array of created users (used by other modules)

### Social Team

#### Posts (`seedModules/socialTeam/posts.ts`)
- Creates public posts from users
- **Dependencies:** Users

#### Comments (`seedModules/socialTeam/comments.ts`)
- Creates comments on posts
- **Dependencies:** Users, Posts

#### Follows (`seedModules/socialTeam/follows.ts`)
- Creates follow relationships between users
- **Dependencies:** Users

#### Likes/Dislikes (`seedModules/socialTeam/likesDislikes.ts`)
- Creates likes and dislikes on posts
- **Dependencies:** Users, Posts

#### Bookmarks (`seedModules/socialTeam/bookmarks.ts`)
- Creates bookmarks for posts
- **Dependencies:** Users, Posts

### Groups Team

#### Groups (`seedModules/groupsTeam/groups.ts`)
- Creates groups owned by users
- **Dependencies:** Users

#### Group Members (`seedModules/groupsTeam/groupMembers.ts`)
- Adds users as members to groups
- **Dependencies:** Users, Groups

#### Group Posts (`seedModules/groupsTeam/groupPosts.ts`)
- Creates posts within groups
- **Dependencies:** Groups, Group Members

#### Group Comments (`seedModules/groupsTeam/groupComments.ts`)
- Creates comments on group posts
- **Dependencies:** Group Posts, Group Members, Users

### Events Team

#### Events (`seedModules/eventsTeam/events.ts`)
- Creates events created by users
- **Dependencies:** Users

#### Event Attendees (`seedModules/eventsTeam/eventAttendees.ts`)
- Adds users as attendees to events
- **Dependencies:** Users, Events

### Notifications Team

#### Notifications (`seedModules/notificationsTeam/notifications.ts`)
- Creates notifications for various actions (likes, comments, follows, etc.)
- **Dependencies:** Posts, Comments, Likes, Dislikes, Follows, Events, Event Attendees

### Media Team

#### Media (`seedModules/mediaTeam/media.ts`)
- Creates media attachments for posts
- **Dependencies:** Posts

### Admin Team

#### Reports (`seedModules/adminTeam/reports.ts`)
- Creates moderation reports
- **Dependencies:** Users, Posts, Groups, Events

### Dating Team

#### Dating Profiles (`seedModules/datingTeam/datingProfiles.ts`)

Creates 200 dating users spread across the United States with **guaranteed test locations** for easy testing.

**Deletion:** Before seeding, the module automatically deletes all existing dating test users:
- Deletes from database (users, profiles, preferences, photos, swipes, matches, location overrides)
- Deletes from StreamChat
- Ensures clean state before creating new test data

**Users:** Creates 200 users with `isDatingActive: true`

**Location Distribution:**
- **50 users in guaranteed test cities** (for easy testing):
  - **Los Angeles, CA** (~8-9 users) - lat: 34.0522, lon: -118.2437
  - **San Francisco, CA** (~8-9 users) - lat: 37.7749, lon: -122.4194
  - **Chicago, IL** (~8-9 users) - lat: 41.8781, lon: -87.6298
  - **New York, NY** (~8-9 users) - lat: 40.7128, lon: -74.006
  - **Austin, TX** (~8-9 users) - lat: 30.2672, lon: -97.7431
  - **Honolulu, HI** (~8-9 users) - lat: 21.3099, lon: -157.8581
- **150 users randomly distributed** across mainland US cities (Houston, Phoenix, Philadelphia, San Antonio, San Diego, Dallas, and 40+ more cities)

**Testing Tip:** Use Travel Mode to set your location to any of the guaranteed test cities above to find users for testing. You don't need to search the map - these cities are guaranteed to have users.

**Profiles:** Creates dating profiles with:
- Age (18-65)
- Height (5'0" - 6'6")
- Gender, sexual orientation, religion
- Coronavirus vaccination status
- Location (city, state)

**Preferences:** Creates dating preferences for each user:
- Age range preferences
- Distance preferences (25-200 km)
- Height preferences
- Gender and sexual orientation preferences
- Religion preferences
- Music taste matching preference

**Photos:** Creates 1-4 photos per user (first photo is primary)

**StreamChat:** Syncs all users to StreamChat

**Dependencies:** None (runs independently, includes its own deletion step)

**User Credentials:**
- Username format: `dating_user_1`, `dating_user_2`, etc.
- Email format: `dating_user_1@test.com`, `dating_user_2@test.com`, etc.
- Password: (your env password, same for all dating users)

## Running Partial Seeds

**Current Status:** The seed system does **NOT** currently support running partial seeds. The entire seed process runs as a single operation.

**Why:** The seed process uses a single transaction to ensure data consistency. All modules are executed sequentially within this transaction, and there's no mechanism to selectively run only certain modules.

**Workaround:** If you need to test a specific feature:
1. Run the full seed: `npm run db:seed`
2. Manually delete/modify data in the database for features you don't need
3. Or modify `seed.ts` temporarily to comment out unwanted seed modules

**Future Enhancement:** The modular structure makes it possible to add partial seeding support in the future. This could be implemented by:
- Adding command-line arguments to specify which modules to run
- Creating separate npm scripts for each feature set
- Modifying `seed.ts` to accept module selection parameters

## NPM Scripts

### `npm run db:seed`
Runs the complete seed process:
1. Builds the seed script (`build:seed`)
2. Executes the seed script

### `npm run build:seed`
Builds the TypeScript seed script to JavaScript using `tsup`.

### `npm run dev:test:seed`
Runs unit tests for seed modules.

### `npm run dev:types:seed`
Type-checks the seed TypeScript files.

## Seed Utilities (`seedUtils.ts`)

Shared utilities available to all seed modules:

- **`prisma`**: Prisma client instance
- **`streamChatClient`**: StreamChat client instance
- **`cypressEnv`**: Configuration from `cypress.env.json`
- **`faker`**: Faker.js instance for generating fake data
- **`generateIdFromEntropySize`**: ID generator from Lucia
- **`passwordHash`**: Password hashing function
- **`random`**: Random number generator helper
- **`weightedRandom`**: Weighted random number generator
- **`proportionateRandom`**: Proportionate random number generator
- **`accountDataGenerator`**: Account data generator helper

## Adding New Seed Modules

To add a new seed module:

1. **Create the module file** in the appropriate team directory:
   ```
   prisma/seedModules/<teamName>/<feature>.ts
   ```

2. **Export a seed function**:
   ```typescript
   export async function seed<Feature>(
     tx: PrismaClient | any,
     // ... other dependencies
   ): Promise<CreatedData[]> {
     // Seed logic here
   }
   ```

3. **Import and call in `seed.ts`**:
   ```typescript
   import { seed<Feature> } from "./seedModules/<teamName>/<feature>.js";
   
   // In the transaction:
   await seed<Feature>(tx as any, /* dependencies */);
   ```

4. **Respect dependencies**: Ensure your module runs after its dependencies

5. **Add tests**: Create a corresponding `.spec.ts` file

## Troubleshooting

### Seed fails with transaction timeout
- The transaction timeout is set to 60 seconds
- If seeding takes longer, increase the timeout in `seed.ts`:
  ```typescript
  await prisma.$transaction(/* ... */, {
    timeout: 120000, // 2 minutes
  });
  ```

### StreamChat errors
- StreamChat errors are logged but don't fail the seed
- Check that `NEXT_PUBLIC_STREAM_KEY` and `STREAM_SECRET` are set in `.env`

### Duplicate key errors
- The seed uses `skipDuplicates: true` for bulk operations
- If you see duplicate errors, check that deletion ran successfully

### Missing dependencies
- Ensure seed modules run in the correct order
- Check that upstream modules return the data your module needs

## Best Practices

1. **Keep modules focused**: Each module should handle one feature area
2. **Return created data**: Return arrays of created records for downstream modules
3. **Handle errors gracefully**: Log errors and return empty arrays rather than crashing
4. **Use transactions**: All seed operations run in a transaction for consistency
5. **Clean up first**: Deletion happens before seeding to avoid conflicts
6. **Log progress**: Use `console.log` to show what's happening during seeding
7. **Test your modules**: Write unit tests for seed modules

## Related Documentation

- `docs/MODULAR_SEEDING_PLAN.md` - Original plan for modular seeding
- `docs/TEAM_STRUCTURE.md` - Team responsibilities
- `cypress.env.json` - Test user configuration

