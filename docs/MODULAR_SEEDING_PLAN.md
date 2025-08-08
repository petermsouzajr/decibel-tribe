# Modular Seeding Strategy Plan

## 1. Goal

To refactor the monolithic `prisma/seed.ts` script into smaller, manageable modules aligned with team responsibilities as defined in `TEAM_STRUCTURE.md`. This will improve maintainability, allow teams to manage their specific seed data independently, and potentially enable more targeted seeding scenarios, while still supporting a full database seed via a single command.

## 2. Motivation

- **Maintainability:** Smaller files are easier to understand, modify, and debug.
- **Team Ownership:** Teams can manage the seed data relevant to their features without conflicts or needing deep knowledge of unrelated parts of the seed script.
- **Clarity:** Explicit dependencies between data types become clearer through the orchestration of modules.
- **Reduced Conflicts:** Less chance of merge conflicts in a single large file.
- **Potential for Targeted Seeding:** While the primary goal is unified seeding, this structure could be adapted later to run only specific modules if needed (e.g., seeding only auth data).

## 3. Proposed Structure

We will create a new directory structure within `prisma/` to house the modular seed logic:

```
prisma/
├── schema.prisma
├── seed.ts                 # Main orchestration script (NEW or REFACTORED)
├── seedUtils.ts            # Shared helper functions, Prisma client instance
└── seedModules/            # Directory for all modular seeding logic
    ├── authTeam/
    │   ├── users.ts        # Handles user creation (incl. test users)
    │   └── sessions.ts     # (If applicable, or combined with users)
    ├── socialTeam/
    │   ├── posts.ts        # Handles public post creation
    │   ├── follows.ts
    │   ├── likesDislikes.ts
    │   └── bookmarks.ts
    │   └── comments.ts     # Handles public post comments
    ├── groupsTeam/
    │   ├── groups.ts
    │   ├── groupMembers.ts
    │   └── groupPosts.ts   # Handles posts specific to groups
    │   └── groupComments.ts# Handles comments specific to group posts
    ├── eventsTeam/
    │   ├── events.ts
    │   └── eventAttendees.ts
    ├── notificationsTeam/
    │   └── notifications.ts # Handles creation of various notification types
    ├── mediaTeam/
    │   └── media.ts        # Handles creating media records linked to posts
     ├── adminTeam/            # Admin & moderation data (reports, admin users)
     │   └── reports.ts
     └── messagingTeam/        # (Placeholder if chat seeding needed)
        └── chats.ts
```

## 4. Refactoring Steps

### 4.1. Create Directory Structure

Create the `prisma/seedModules/` directory and subdirectories for each team (`authTeam`, `socialTeam`, etc.) as outlined above.

### 4.2. Extract Shared Utilities (`prisma/seedUtils.ts`)

- Create `prisma/seedUtils.ts`.
- Move common helper functions and setup logic from the current `seed.ts` into `seedUtils.ts`:
  - `PrismaClient` instantiation (`prisma`).
  - `faker` import and setup.
  - `StreamChat` client initialization (`streamChatClient`).
  - Helper functions like `random`, `weightedRandom`, `proportionateRandom`, `accountDataGenerator`.
  - `generateIdFromEntropySize` import/usage.
  - Import `dotenv`, `fs`, `path`, `cypressEnv`.
- Export these utilities/instances so they can be imported by modules and the main `seed.ts`.
- **Important:** Ensure the Prisma client is instantiated _once_ here and exported, rather than in each module.

```typescript
// prisma/seedUtils.ts (Example Structure)
import { PrismaClient, GroupRole, NotificationType } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { StreamChat } from "stream-chat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { generateIdFromEntropySize as luciaGenerateId } from "lucia"; // Assuming direct import works

// Load env vars
const envPath = path.resolve(__dirname, "../../.env"); // Adjust path relative to new location
dotenv.config({ path: envPath });
const cypressEnvPath = path.resolve(__dirname, "../../cypress.env.json"); // Adjust path
export const cypressEnv = JSON.parse(fs.readFileSync(cypressEnvPath, "utf-8"));

// Prisma Client
export const prisma = new PrismaClient();

// Faker
export { faker };

// Stream Chat Client
const streamKey = process.env.NEXT_PUBLIC_STREAM_KEY!;
const streamSecret = process.env.STREAM_SECRET!;
export const streamChatClient = StreamChat.getInstance(streamKey, streamSecret);

// Lucia ID generation
export const generateIdFromEntropySize = luciaGenerateId;

// Random Helpers
export const random = (min: number, max: number) =>
  faker.number.int({ min, max });
// ... other helpers ...
export const accountDataGenerator = (
  value: string | number,
  users: number,
  factor: number,
) => {
  // ... implementation ...
};

// Constants (if needed globally)
export { GroupRole, NotificationType };
export const passwordHash = async (password: string) => {
  const { hash } = await import("argon2"); // Dynamic import if needed top-level
  return hash(password, {
    /* options */
  });
};
// ... other utils or constants ...
```

### 4.3. Modularize Creation Functions

For each logical data creation step in the original `seed.ts` (e.g., `createUsers`, `createGroups`, `createPublicPosts`, `createFollowers`, etc.):

1.  **Assign Ownership:** Determine which team is responsible based on `TEAM_STRUCTURE.md`.
2.  **Create Module File:** Create the corresponding `.ts` file within the team's directory in `prisma/seedModules/` (e.g., `prisma/seedModules/authTeam/users.ts`).
3.  **Define Exported Function:** Inside the module file, define and export an `async` function (e.g., `export async function seedUsers(...)`).
4.  **Define Inputs:** This function should accept necessary dependencies as arguments:
    - The shared `prisma` client instance.
    - Any required utilities (`faker`, `generateIdFromEntropySize`, etc.) from `seedUtils.ts`.
    - Crucially, data created by _previous_ steps if needed (e.g., `seedPosts` needs the list of created users).
5.  **Move Logic:** Migrate the data generation logic (using `faker`, helpers) and the `prisma.createMany` call for that specific data type from the old `seed.ts` into this new function.
6.  **Return Created Data:** The function _must_ `return` the data it created (or at least the IDs and any other fields needed by subsequent steps) so it can be passed to the next module in the sequence.
7.  **Type Safety:** Explicitly type the arrays used to collect data before `createMany`. Address the `Argument of type '...' is not assignable to parameter of type 'never'` errors by ensuring the array type matches the expected `Prisma.<Model>CreateInput[]` type. For example:
    ```typescript
    import { Prisma } from "@prisma/client";
    // ...
    const usersData: Prisma.UserCreateInput[] = []; // Explicitly type the array
    // ... inside loop ...
    usersData.push({
      /* user data object matching UserCreateInput */
    });
    // ...
    await prisma.user.createMany({ data: usersData, skipDuplicates: true });
    ```
8.  **Handle Test Users:** Ensure the `authTeam/users.ts` module correctly incorporates the logic for creating the specific test users defined in `cypress.env.json`, including their specific usernames, emails, verification status, etc.
9.  **StreamChat Logic:** Include relevant StreamChat calls (`upsertUsers`, `deleteUser`) within the appropriate modules (e.g., `authTeam/users.ts`).

```typescript
// prisma/seedModules/authTeam/users.ts (Example Structure)
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client"; // Import specific types
import {
  faker,
  generateIdFromEntropySize,
  cypressEnv,
  streamChatClient,
  passwordHash,
} from "../seedUtils"; // Adjust path

interface CreatedUser {
  // Define an interface for returned data
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  // Add other fields if needed by subsequent modules
}

export async function seedUsers(prisma: PrismaClient): Promise<CreatedUser[]> {
  console.log("Seeding users...");
  const usersData: Prisma.UserCreateInput[] = [];
  const createdUsersForReturn: CreatedUser[] = []; // Separate array for return value if needed

  const hashedPassword = await passwordHash(cypressEnv.password);

  // Logic from original createUsers, adapted to use imported utils
  // Ensure cypress.env test users are created specifically
  for (const userType of Object.keys(cypressEnv)
    .filter((key) => key.endsWith("Username"))
    .map((key) => key.replace("Username", ""))) {
    // ... logic to generate user data based on userType and cypressEnv ...
    const userData = {
      /* ... user data ... */
    };
    usersData.push(userData);
    createdUsersForReturn.push({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      createdAt: userData.createdAt,
    });
  }

  // Add random users if needed (beyond test users)

  await prisma.user.createMany({ data: usersData, skipDuplicates: true });
  console.log(`...${usersData.length} users created in DB.`);

  // Stream Chat Upsert
  const streamChatUsers = usersData.map((user) => ({
    id: user.id,
    name: user.displayName,
    // ... other stream chat fields
  }));
  try {
    await streamChatClient.upsertUsers(streamChatUsers);
    console.log(`...${streamChatUsers.length} users upserted to StreamChat.`);
  } catch (error) {
    console.error("StreamChat upsert failed:", error);
  }

  return createdUsersForReturn; // Return relevant data
}
```

### 4.4. Create Orchestration Script (`prisma/seed.ts`)

1.  **Clear/Replace:** Replace the content of the original `prisma/seed.ts` or create a new main script (e.g., `prisma/runSeed.ts` - if using this, update `package.json` accordingly).
2.  **Imports:** Import the `prisma` client from `seedUtils.ts` and _all_ the `seed<Feature>` functions from your modules in `prisma/seedModules/`.
3.  **Import Deletion Logic:** Import or include the `deleteTestUsers` and `deleteTestUsersFromStreamChat` functions (these could also be moved to `seedUtils.ts`).
4.  **Define `main` Function:** Create an `async function main()`.
5.  **Deletion First:** Call `deleteTestUsers` and `deleteTestUsersFromStreamChat` at the beginning of `main`.
6.  **Sequential Execution:** Inside `main`, call the imported module functions _sequentially using `await`_, respecting data dependencies. Pass the `prisma` client and any data returned from previous steps as arguments.
7.  **Error Handling:** Wrap the seeding logic in a `try...catch...finally` block, ensuring `prisma.$disconnect()` is called in `finally`.

```typescript
// prisma/seed.ts (New Orchestration Script)
import { prisma } from "./seedUtils"; // Get shared Prisma instance
// Import deletion logic if moved to utils, or define here
import { deleteTestUsers, deleteTestUsersFromStreamChat } from "./seedDeletion"; // Assuming deletion logic moved

// Import all modular seed functions
import { seedUsers } from "./seedModules/authTeam/users";
import { seedGroups } from "./seedModules/groupsTeam/groups";
import { seedGroupMembers } from "./seedModules/groupsTeam/groupMembers";
import { seedPosts } from "./seedModules/socialTeam/posts"; // Assuming combined public/group or separate files
import { seedComments } from "./seedModules/socialTeam/comments";
import { seedEvents } from "./seedModules/eventsTeam/events";
import { seedEventAttendees } from "./seedModules/eventsTeam/eventAttendees";
import { seedFollows } from "./seedModules/socialTeam/follows";
import { seedLikesDislikes } from "./seedModules/socialTeam/likesDislikes";
import { seedBookmarks } from "./seedModules/socialTeam/bookmarks";
import { seedMedia } from "./seedModules/mediaTeam/media";
import { seedNotifications } from "./seedModules/notificationsTeam/notifications";
// ... import other modules

async function main() {
  console.log("Starting database seeding process...");

  // 1. Deletion
  // await deleteTestUsersFromStreamChat(/* pass test usernames if needed */); // Needs careful implementation
  await deleteTestUsers(); // Delete from DB

  console.log("Starting data creation...");

  // 2. Seeding - Execute modules sequentially, passing data
  const createdUsers = await seedUsers(prisma);
  const createdGroups = await seedGroups(prisma, createdUsers); // Needs users
  const createdGroupMembers = await seedGroupMembers(
    prisma,
    createdUsers,
    createdGroups,
  ); // Needs users & groups
  const createdPosts = await seedPosts(
    prisma,
    createdUsers,
    createdGroups,
    createdGroupMembers,
  ); // Needs users, potentially groups/members
  const createdComments = await seedComments(
    prisma,
    createdUsers,
    createdPosts,
  ); // Needs users & posts
  const createdEvents = await seedEvents(prisma, createdUsers); // Needs users
  const createdAttendees = await seedEventAttendees(
    prisma,
    createdUsers,
    createdEvents,
  ); // Needs users & events
  const createdFollows = await seedFollows(prisma, createdUsers); // Needs users
  const { createdLikes, createdDislikes } = await seedLikesDislikes(
    prisma,
    createdUsers,
    createdPosts,
  ); // Needs users & posts
  await seedBookmarks(prisma, createdUsers, createdPosts); // Needs users & posts
  await seedMedia(prisma, createdPosts); // Needs posts

  // Notifications often depend on many other actions
  await seedNotifications(
    prisma,
    createdUsers,
    createdPosts,
    createdComments,
    createdLikes,
    createdDislikes,
    createdFollows,
    createdEvents,
    createdAttendees,
    // Pass other necessary data
  );

  // ... call other seed modules in correct order ...

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Prisma client disconnected.");
  });
```

### 4.5. Update Execution Command

- Modify the `seed` script in your `package.json` to execute the new orchestration script using `ts-node` (or your chosen TypeScript runner).

```json
// package.json (Example)
{
  "scripts": {
    "db:seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
    // or "db:seed": "ts-node prisma/runSeed.ts" if you used a different name
  }
}
```

## 5. Team Responsibilities Alignment

- **Ownership:** Each team listed in `TEAM_STRUCTURE.md` is now the primary owner of the corresponding module(s) under `prisma/seedModules/<teamName>/`.
  - `AuthTeam`: Owns `prisma/seedModules/authTeam/users.ts` (including test users, password hashing, verification status, StreamChat user sync).
  - `SocialTeam`: Owns `posts.ts`, `follows.ts`, `likesDislikes.ts`, `bookmarks.ts`, `comments.ts` under `socialTeam/`.
  - `GroupsTeam`: Owns `groups.ts`, `groupMembers.ts`, `groupPosts.ts`, `groupComments.ts` under `groupsTeam/`.
  - `EventsTeam`: Owns `events.ts`, `eventAttendees.ts` under `eventsTeam/`.
  - `NotificationsTeam`: Owns `notifications.ts` under `notificationsTeam/`, coordinating with other teams on the triggers.
  - `MediaTeam`: Owns `media.ts` under `mediaTeam/`.
  - `AdminTeam`: Owns `reports.ts` under `adminTeam/`. Responsible for seeding moderation reports and ensuring consistency for the reporting feature across the platform.
  - `PlatformTeam`: Owns the overall structure, `seedUtils.ts`, the main orchestration script (`seed.ts`), and the execution command in `package.json`.
- **Maintenance:** Teams are responsible for updating their modules when their features change or require different seed data.
- **Dependencies:** If a team adds a feature requiring new seed data that depends on another team's data, they must coordinate to ensure the necessary data is passed correctly in the main `seed.ts` orchestration script. The `PlatformTeam` can help facilitate this.

## 6. Testing Strategy

To ensure the reliability and correctness of the modular seeding process, implement the following testing approaches:

### 6.1. Unit Testing for Seed Modules (`prisma/seedModules/**/*.spec.ts`)

- **Purpose:** Verify the data generation logic within each module _without_ hitting the database or external services (like StreamChat).
- **Tooling:** Use Vitest (as per project standards).
- **Implementation:**
  - Create spec files alongside module files (e.g., `users.spec.ts` next to `users.ts`).
  - **Mock Dependencies:** Use `vi.mock()` to mock the entire `prisma/seedUtils` module. Provide mock implementations for `prisma` client methods (`createMany`, `findMany`, etc.) and `streamChatClient` methods (`upsertUsers`, `deleteUser`) used by the module under test. Return realistic but controlled responses (e.g., `mockResolvedValue({ count: N })`).
  - Import the mocked utilities and the actual `seed<Feature>` function from the module.
  - **Test Logic & Structure:** Write tests to:
    - Verify that the `seed<Feature>` function calls the correct `prisma` methods (`createMany`) with the expected arguments (`data` array).
    - Assert that the data objects generated and passed to `createMany` have the correct structure, required fields, and types according to the Prisma schema.
    - Write the tests directly in the subject-modules directories.
    - Test specific logic within the module, such as conditional data generation, handling of test user flags, or calculations.
    - Verify that the function returns the expected data structure (e.g., an array of created IDs or objects) needed for subsequent modules.
    - Verify that external services like `streamChatClient.upsertUsers` are called with correctly formatted data.
- **Benefits:** Fast feedback, isolates logic errors, ensures data structures are correct, prevents regressions during refactoring.

```typescript
// Example: prisma/seedModules/authTeam/users.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the entire utility module
vi.mock('../seedUtils', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original, // Keep helpers if needed
    prisma: {
      user: {
        createMany: vi.fn().mockResolvedValue({ count: 5 }), // Mock the DB call
      },
    },
    streamChatClient: {
      upsertUsers: vi.fn().mockResolvedValue({}), // Mock the Stream call
    },
  };
});

// Import mocked utils and the function to test
const { prisma, streamChatClient } = await import('../seedUtils');
const { seedUsers } = await import('./users');

d describe('seedUsers Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call prisma.user.createMany with correctly structured data', async () => {
    await seedUsers(prisma); // Pass mocked prisma

    expect(prisma.user.createMany).toHaveBeenCalledOnce();
    const createArgs = (prisma.user.createMany as any).mock.calls[0][0];
    expect(createArgs.data).toBeInstanceOf(Array);
    expect(createArgs.data[0]).toHaveProperty('username');
    expect(createArgs.data[0]).toHaveProperty('passwordHash');
    // ... other structure checks
  });

  it('should call streamChatClient.upsertUsers', async () => {
    await seedUsers(prisma);
    expect(streamChatClient.upsertUsers).toHaveBeenCalledOnce();
     // ... check arguments passed to upsertUsers
  });
});
```

### 6.2. Pre-Run Checks in Orchestration Script (`prisma/seed.ts`)

- **Purpose:** Validate the environment and configuration _before_ executing the potentially lengthy seeding process to fail fast.
- **Implementation:** Add checks at the beginning of the `main` function in `prisma/seed.ts`:
  - **Environment Variables:** Verify required variables (`DATABASE_URL`, `STREAM_SECRET`, etc.) are set in `process.env`. Throw an error if missing.
  - **Configuration Files:** Check that necessary config files (e.g., `cypress.env.json`) are present and contain essential keys.
  - **Database Connectivity:** Add a step to explicitly connect and perform a trivial query (e.g., `prisma.$queryRaw`SELECT 1`) to confirm the database is reachable before attempting deletions or creations.

```typescript
// Example pre-run checks in prisma/seed.ts main()
async function main() {
  console.log("Verifying environment...");
  if (!process.env.DATABASE_URL) {
    /* throw error */
  }
  if (!cypressEnv || !cypressEnv.password) {
    /* throw error */
  }

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection verified.");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }

  console.log("Starting database seeding process...");
  // ... rest of main function (deletion, module execution) ...
}
```

- **Benefits:** Prevents running the seed script in an invalid environment, saves time, provides clearer error messages for setup issues.

### 6.3. Manual Verification (Post-Seed)

- **Purpose:** Occasionally sanity-check the generated data directly in the database or via the application UI after a full seed run, especially after significant changes.
- **Implementation:** Browse the application, check specific test user profiles (`cypress.env.json`), verify relationships (follows, group memberships), check counts.
- **Benefits:** Catches high-level integration issues or logical errors not covered by unit tests.

## 7. Potential Challenges & Considerations

- **Dependency Management:** The order of execution in the main `seed.ts` is critical. Ensure modules are called only after their dependencies have been created and the necessary data (e.g., IDs) has been returned and passed along.
- **Data Passing:** Decide whether to pass full objects or just IDs between modules. Passing only IDs is generally cleaner but might require modules to re-fetch data if more details are needed. Passing full objects can be convenient but might use more memory.
- **Performance:** While `createMany` is efficient, seeding a very large amount of interdependent data can still be slow. Monitor execution time.
- **Type Safety:** Diligently apply correct Prisma types (`Prisma.<Model>CreateInput[]`) to fix the existing linter errors and prevent future ones.
- **Transactionality:** The current script runs operations sequentially. If an error occurs midway, the database will be left in a partially seeded state (though the initial deletion helps). For true atomicity, more complex transaction management across modules would be needed, which adds significant complexity and is likely overkill for a seed script unless specifically required.
- **StreamChat Synchronization:** Ensure StreamChat user creation/deletion aligns correctly with DB operations. Failures in StreamChat API calls should be logged but might not necessarily halt the entire DB seeding process unless desired.

This plan provides a clear path to modularizing the seed script, aligning it with your team structure and improving its long-term health. Remember to address the type errors during the refactoring process.
