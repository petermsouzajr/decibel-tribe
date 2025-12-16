import { PrismaClient, Prisma, NotificationType } from "@prisma/client";
import {
  faker,
  generateIdFromEntropySize,
  passwordHash,
  streamChatClient,
  cypressEnv,
} from "../../seedUtils.js";

// Interface for the data returned by this module
export interface CreatedDatingUser {
  id: string;
  userId: string;
  username: string;
  isDatingActive: boolean;
}

/**
 * HARDCODED TESTING LOCATIONS
 * ============================
 * For testing purposes, 50 users are guaranteed to be in these specific cities:
 * - Los Angeles, CA (10 users) - lat: 34.0522, lon: -118.2437
 * - San Francisco, CA (10 users) - lat: 37.7749, lon: -122.4194
 * - Chicago, IL (10 users) - lat: 41.8781, lon: -87.6298
 * - New York, NY (10 users) - lat: 40.7128, lon: -74.006
 * - Austin, TX (10 users) - lat: 30.2672, lon: -97.7431
 * - Honolulu, HI (10 users) - lat: 21.3099, lon: -157.8581
 *
 * The remaining 150 users are randomly distributed across mainland US cities.
 * Testers can update their zip code to set their location to any of these cities
 * to find guaranteed users for testing.
 */

// Major cities with guaranteed user placement (for testing)
// Using zip codes for location matching
const GUARANTEED_TEST_CITIES = [
  { city: "Los Angeles", state: "CA", zip: "90001", lat: 34.0522, lon: -118.2437 },
  { city: "San Francisco", state: "CA", zip: "94102", lat: 37.7749, lon: -122.4194 },
  { city: "Chicago", state: "IL", zip: "60601", lat: 41.8781, lon: -87.6298 },
  { city: "New York", state: "NY", zip: "10001", lat: 40.7128, lon: -74.006 },
  { city: "Austin", state: "TX", zip: "78701", lat: 30.2672, lon: -97.7431 },
  { city: "Honolulu", state: "HI", zip: "96801", lat: 21.3099, lon: -157.8581 },
];

const USERS_PER_GUARANTEED_CITY = 10; // 6 cities × 10 users = 60 users (we'll use 50)

// Additional US cities for random distribution (mainland only)
const RANDOM_MAINLAND_CITIES = [
  { city: "Houston", state: "TX", zip: "77001", lat: 29.7604, lon: -95.3698 },
  { city: "Phoenix", state: "AZ", zip: "85001", lat: 33.4484, lon: -112.074 },
  { city: "Philadelphia", state: "PA", zip: "19101", lat: 39.9526, lon: -75.1652 },
  { city: "San Antonio", state: "TX", zip: "78201", lat: 29.4241, lon: -98.4936 },
  { city: "San Diego", state: "CA", zip: "92101", lat: 32.7157, lon: -117.1611 },
  { city: "Dallas", state: "TX", zip: "75201", lat: 32.7767, lon: -96.797 },
  { city: "San Jose", state: "CA", zip: "95101", lat: 37.3382, lon: -121.8863 },
  { city: "Jacksonville", state: "FL", zip: "32099", lat: 30.3322, lon: -81.6557 },
  { city: "Fort Worth", state: "TX", zip: "76101", lat: 32.7555, lon: -97.3308 },
  { city: "Columbus", state: "OH", zip: "43201", lat: 39.9612, lon: -82.9988 },
  { city: "Charlotte", state: "NC", zip: "28201", lat: 35.2271, lon: -80.8431 },
  { city: "Indianapolis", state: "IN", zip: "46201", lat: 39.7684, lon: -86.1581 },
  { city: "Seattle", state: "WA", zip: "98101", lat: 47.6062, lon: -122.3321 },
  { city: "Denver", state: "CO", zip: "80201", lat: 39.7392, lon: -104.9903 },
  { city: "Washington", state: "DC", zip: "20001", lat: 38.9072, lon: -77.0369 },
  { city: "Boston", state: "MA", zip: "02101", lat: 42.3601, lon: -71.0589 },
  { city: "El Paso", state: "TX", zip: "79901", lat: 31.7619, lon: -106.485 },
  { city: "Nashville", state: "TN", zip: "37201", lat: 36.1627, lon: -86.7816 },
  { city: "Detroit", state: "MI", zip: "48201", lat: 42.3314, lon: -83.0458 },
  { city: "Oklahoma City", state: "OK", zip: "73101", lat: 35.4676, lon: -97.5164 },
  { city: "Portland", state: "OR", zip: "97201", lat: 45.5152, lon: -122.6784 },
  { city: "Las Vegas", state: "NV", zip: "89101", lat: 36.1699, lon: -115.1398 },
  { city: "Memphis", state: "TN", zip: "38101", lat: 35.1495, lon: -90.049 },
  { city: "Louisville", state: "KY", zip: "40201", lat: 38.2527, lon: -85.7585 },
  { city: "Baltimore", state: "MD", zip: "21201", lat: 39.2904, lon: -76.6122 },
  { city: "Milwaukee", state: "WI", zip: "53201", lat: 43.0389, lon: -87.9065 },
  { city: "Albuquerque", state: "NM", zip: "87101", lat: 35.0844, lon: -106.6504 },
  { city: "Tucson", state: "AZ", zip: "85701", lat: 32.2226, lon: -110.9747 },
  { city: "Fresno", state: "CA", zip: "93701", lat: 36.7378, lon: -119.7871 },
  { city: "Sacramento", state: "CA", zip: "95814", lat: 38.5816, lon: -121.4944 },
  { city: "Kansas City", state: "MO", zip: "64101", lat: 39.0997, lon: -94.5786 },
  { city: "Mesa", state: "AZ", zip: "85201", lat: 33.4152, lon: -111.8315 },
  { city: "Atlanta", state: "GA", zip: "30301", lat: 33.749, lon: -84.388 },
  { city: "Omaha", state: "NE", zip: "68101", lat: 41.2565, lon: -95.9345 },
  { city: "Colorado Springs", state: "CO", zip: "80901", lat: 38.8339, lon: -104.8214 },
  { city: "Raleigh", state: "NC", zip: "27601", lat: 35.7796, lon: -78.6382 },
  { city: "Virginia Beach", state: "VA", zip: "23451", lat: 36.8529, lon: -75.978 },
  { city: "Miami", state: "FL", zip: "33101", lat: 25.7617, lon: -80.1918 },
  { city: "Oakland", state: "CA", zip: "94601", lat: 37.8044, lon: -122.2712 },
  { city: "Minneapolis", state: "MN", zip: "55401", lat: 44.9778, lon: -93.265 },
  { city: "Tulsa", state: "OK", zip: "74101", lat: 36.154, lon: -95.9928 },
  { city: "Cleveland", state: "OH", zip: "44101", lat: 41.4993, lon: -81.6944 },
  { city: "Wichita", state: "KS", zip: "67201", lat: 37.6872, lon: -97.3301 },
  { city: "Arlington", state: "TX", zip: "76001", lat: 32.7357, lon: -97.1081 },
  { city: "New Orleans", state: "LA", zip: "70112", lat: 29.9511, lon: -90.0715 },
];

const DATING_USER_COUNT = 200;
const GUARANTEED_USERS_COUNT = 50; // 50 users in guaranteed test cities
const RANDOM_USERS_COUNT = DATING_USER_COUNT - GUARANTEED_USERS_COUNT; // 150 users randomly distributed

// Gender options
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

// Sexual orientation options
const SEXUAL_ORIENTATIONS = [
  "Straight",
  "Gay",
  "Bisexual",
  "Other",
];

// Religion options
const RELIGIONS = [
  "Christian",
  "Catholic",
  "Jewish",
  "Muslim",
  "Buddhist",
  "Hindu",
  "Sikh",
  "Atheist",
  "Agnostic",
  "Undecided",
];

// Coronavirus vaccination status
const VACCINATION_STATUS = ["Yes", "No", ""];

// Education levels
const EDUCATION_LEVELS = ["high_school", "some_college", "bachelors", "masters", "phd", "professional"];

// Political views
const POLITICAL_VIEWS = ["Liberal", "Conservative", "Moderate", "Progressive", "Libertarian", "Apolitical", "Other"];

// Diet preferences
const DIET_OPTIONS = ["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Kosher", "Halal", "Gluten-free", "Keto", "Paleo", "Other"];

// Relationship type
const RELATIONSHIP_TYPES = ["Monogamous", "Ethical Non-Monogamy", "Open to Both"];

// Height range in inches (for US)
const MIN_HEIGHT_INCHES = 36; // 3'0"
const MAX_HEIGHT_INCHES = 94; // 8'0"

// Age range
const MIN_AGE = 18;
const MAX_AGE = 130;

// Optional profile fields for random distribution
const SMOKES_OPTIONS = ["Yes", "No", "Social"];
const DRINKS_OPTIONS = ["Yes", "No", "Social"];
const ACTIVITY_OPTIONS = ["Active", "Sporting", "Super active", "Couch potato", "Hiker", "Moderate", "Very active"];
const INTERESTS_OPTIONS = [
  "Gamer", "Foodie", "Traveler", "Photographer", "Musician", "Artist", "Writer",
  "Fitness enthusiast", "Yoga", "Reading", "Movies", "Cooking", "Dancing", "Hiking",
  "Surfing", "Cycling", "Running", "Swimming", "Tennis", "Basketball", "Soccer",
  "Golf", "Rock climbing", "Skiing", "Snowboarding", "Camping", "Fishing",
  "Gardening", "Volunteering", "Meditation", "Podcasts", "Comedy", "Theater",
  "Concerts", "Festivals", "Wine tasting", "Coffee", "Craft beer", "Board games",
  "Video games", "Anime", "Comics", "Fashion", "Shopping", "Beauty", "Makeup",
  "Skincare", "Fashion design", "Interior design", "DIY", "Crafts", "Knitting",
  "Sewing", "Painting", "Drawing", "Sculpting", "Pottery", "Woodworking",
  "Cars", "Motorcycles", "Technology", "Coding", "Entrepreneurship", "Business",
  "Finance", "Investing", "Real estate", "Politics", "History", "Science",
  "Astronomy", "Philosophy", "Languages", "Learning", "Education", "Teaching",
  "Pets", "Dogs", "Cats", "Animals", "Wildlife", "Nature", "Environmentalism",
  "Sustainability", "Vegan", "Vegetarian", "Health", "Wellness", "Nutrition",
  "Fitness", "Bodybuilding", "CrossFit", "Martial arts", "Boxing", "MMA",
  "Dancing", "Ballet", "Hip hop", "Salsa", "Bachata", "Ballroom", "Latin",
  "Jazz", "Blues", "Country", "Electronic", "EDM", "House", "Techno",
  "Trance", "Dubstep", "Hip hop music", "Rap", "R&B", "Pop", "Rock",
  "Metal", "Punk", "Indie", "Alternative", "Folk", "Classical", "Jazz",
  "Blues", "Reggae", "World music", "K-pop", "J-pop", "Latin music",
  "Salsa music", "Bachata music", "Merengue", "Cumbia", "Reggaeton",
  "Flamenco", "Tango", "Samba", "Bossa nova", "Afrobeat", "Afrobeats",
];

// Photo count range - increased for more variety
const MIN_PHOTOS = 1;
const MAX_PHOTOS = 6;

/**
 * Deletes existing dating test users from database and StreamChat
 * This ensures clean state before seeding new dating users
 */
export async function deleteDatingTestUsers(
  tx: PrismaClient | any,
  streamClient: any,
): Promise<string[]> {
  console.log("Deleting existing dating test users...");

  try {
    // Get the unique test domain (same as regular seed uses)
    const testDomain = cypressEnv.testUserEmailDomain;
    if (!testDomain) {
      console.error(
        "testUserEmailDomain not found in cypress.env.json. Cannot delete by domain.",
      );
      return [];
    }

    // Find all dating users by username pattern or email domain in database
    // Use the same test domain as the regular seed to catch all test users
    const datingUsers = await tx.user.findMany({
      where: {
        OR: [
          { username: { startsWith: "dating_user_" } },
          { email: { endsWith: testDomain } },
        ],
      },
      select: { id: true },
    });

    const userIds = datingUsers.map((user: { id: string }) => user.id);

    if (userIds.length === 0) {
      console.log("...No existing dating test users found to delete.");
      
      // Even if no database users found, try to clean up orphaned StreamChat users
      // Query StreamChat for users with emails ending in test domain
      if (streamClient) {
        try {
          // Try to query StreamChat for test users by querying for known test user patterns
          // Since StreamChat doesn't support email pattern queries easily, we'll query by ID ranges
          // or try to get all users and filter (but that's expensive)
          // For now, we'll skip orphaned user cleanup if no database users exist
          console.log(`...Skipping StreamChat cleanup (no database users to match with domain ${testDomain}).`);
        } catch (error) {
          // Ignore errors when no users exist
        }
      }
      return [];
    }

    // Delete from StreamChat FIRST (before database deletion) to ensure we catch all users
    // Query StreamChat by userIds (same approach as regular seed: query DB by email, then StreamChat by userIds)
    // This matches the regular seed's reliable method in seedDeletion.ts
    let streamChatDeletedCount = 0;
    if (streamClient && userIds.length > 0) {
      try {
        // Query StreamChat for users matching the database userIds
        // This is the same approach used in seedDeletion.ts for regular seed users
        // StreamChat queryUsers supports querying by ID array
        const streamUsers = await streamClient.queryUsers({
          id: { $in: userIds },
        });

        if (streamUsers.users.length > 0) {
          console.log(
            `...Found ${streamUsers.users.length} dating users in StreamChat (out of ${userIds.length} database users).`,
          );

          if (streamUsers.users.length < userIds.length) {
            console.log(
              `...Note: ${userIds.length - streamUsers.users.length} database users had no StreamChat entries (likely from incomplete previous seed).`,
            );
          }

          for (const user of streamUsers.users) {
            try {
              await streamClient.deleteUser(user.id, { hardDelete: true });
              streamChatDeletedCount++;
            } catch (error) {
              console.error(
                `Failed to delete user ${user.id} from StreamChat:`,
                (error as Error).message,
              );
            }
          }
          console.log(
            `...${streamChatDeletedCount} dating users deleted from StreamChat.`,
          );
        } else {
          console.log(
            `...No matching StreamChat users found (${userIds.length} database users had no StreamChat entries - likely from incomplete previous seed).`,
          );
        }
      } catch (error) {
        console.error(
          "Error deleting dating users from StreamChat:",
          (error as Error).message,
        );
      }
    }

    // Delete related dating data from database
    // Delete in order to respect foreign key constraints
    await tx.event.deleteMany({
      where: { createdById: { in: userIds } },
    });
    await tx.post.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.comment.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.like.deleteMany({ where: { userId: { in: userIds } } });
    await tx.dislike.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.bookmark.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.groupMember.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.eventAttendee.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.notification.deleteMany({
      where: {
        OR: [{ recipientId: { in: userIds } }, { issuerId: { in: userIds } }],
      },
    });
    await tx.follow.deleteMany({
      where: {
        OR: [{ followerId: { in: userIds } }, { followingId: { in: userIds } }],
      },
    });
    await tx.report.deleteMany({
      where: {
        OR: [{ reporterId: { in: userIds } }, { reportedId: { in: userIds } }],
      },
    });
    await tx.block.deleteMany({
      where: {
        OR: [{ blockerId: { in: userIds } }, { blockedId: { in: userIds } }],
      },
    });
    await tx.userDatingPhoto.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.userDatingPreferences.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.userDatingProfile.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.swipe.deleteMany({
      where: {
        OR: [
          { fromUserId: { in: userIds } },
          { toUserId: { in: userIds } },
        ],
      },
    });
    await tx.match.deleteMany({
      where: {
        OR: [
          { user1Id: { in: userIds } },
          { user2Id: { in: userIds } },
        ],
      },
    });

    // Delete users last
    await tx.user.deleteMany({
      where: { id: { in: userIds } },
    });

    console.log(
      `...${userIds.length} dating test users and related data deleted from database.`,
    );

    return userIds;
  } catch (error) {
    console.error("Error deleting dating test users:", error);
    return [];
  }
}

export async function seedDatingProfiles(
  tx: PrismaClient | any,
  streamClient: any,
  hasher: (pw: string) => Promise<string>,
): Promise<CreatedDatingUser[]> {
  if (!tx) {
    console.error("Prisma client is not available for seedDatingProfiles.");
    return [];
  }

  // Note: Deletion is handled outside the transaction in seedDatingOnly.ts
  // This function only handles seeding

  console.log(`Seeding ${DATING_USER_COUNT} dating profiles...`);

  // Get the unique test domain (same as regular seed uses)
  const testDomain = cypressEnv.testUserEmailDomain;
  if (!testDomain) {
    throw new Error(
      "testUserEmailDomain not found in cypress.env.json. Cannot create dating users.",
    );
  }

  const hashedPassword = await hasher(cypressEnv.password as string); // Default password for test users
  const createdDatingUsers: CreatedDatingUser[] = [];
  const usersToCreate: Prisma.UserCreateInput[] = [];
  const profilesToCreate: Prisma.userDatingProfileCreateInput[] = [];
  const preferencesToCreate: Prisma.userDatingPreferencesCreateInput[] = [];
  const photosToCreate: Prisma.userDatingPhotoCreateInput[] = [];
  const swipesToCreate: Array<{ fromUserId: string; toUserId: string; direction: string }> = [];
  const matchesToCreate: Array<{ user1Id: string; user2Id: string }> = [];

  let userIndex = 0;

  // Create specific test users with predefined relationships for easy testing
  console.log("Creating test users with predefined dating relationships...");
  const testUsers: Record<string, { id: string; userId: string; username: string }> = {};
  
  // Test user scenarios:
  // 1. testUserDatingDeckReady - Has 5 compatible users ready in deck (no swipes yet)
  // 2. testUserDatingPendingMatches - Has 5 users who liked them (pending matches)
  // 3. testUserDatingMutualMatches - Has 3 mutual matches already
  // 4. testUserDatingNoMatches - Fresh user with no activity
  // 5. testUserDatingLikedBack - Has liked 5 users, waiting for responses
  
  const testUserConfigs = [
    {
      username: "testUserDatingDeckReady",
      displayName: "Deck Ready User",
      age: 28,
      gender: "Male",
      sexualOrientation: "Straight",
      location: GUARANTEED_TEST_CITIES[0], // Los Angeles
      preferredGender: JSON.stringify([{ gender: "Female", sexualOrientation: ["Straight"] }]),
      preferredSexualOrientation: "Straight",
      preferredMinAge: 23,
      preferredMaxAge: 35,
    },
    {
      username: "testUserDatingPendingMatches",
      displayName: "Pending Matches User",
      age: 25,
      gender: "Female",
      sexualOrientation: "Straight",
      location: GUARANTEED_TEST_CITIES[0], // Los Angeles
      preferredGender: JSON.stringify([{ gender: "Male", sexualOrientation: ["Straight"] }]),
      preferredSexualOrientation: "Straight",
      preferredMinAge: 23,
      preferredMaxAge: 32,
    },
    {
      username: "testUserDatingMutualMatches",
      displayName: "Mutual Matches User",
      age: 30,
      gender: "Male",
      sexualOrientation: "Bisexual",
      location: GUARANTEED_TEST_CITIES[1], // San Francisco
      preferredGender: JSON.stringify([
        { gender: "Female", sexualOrientation: ["Straight", "Bisexual"] },
        { gender: "Male", sexualOrientation: ["Gay", "Bisexual"] },
        { gender: "Non-binary", sexualOrientation: [] }
      ]), // Open to any - set all genders
      preferredSexualOrientation: null,
      preferredMinAge: 25,
      preferredMaxAge: 40,
    },
    {
      username: "testUserDatingNoMatches",
      displayName: "No Matches User",
      age: 22,
      gender: "Female",
      sexualOrientation: "Straight",
      location: GUARANTEED_TEST_CITIES[2], // Chicago
      preferredGender: JSON.stringify([{ gender: "Male", sexualOrientation: ["Straight"] }]),
      preferredSexualOrientation: "Straight",
      preferredMinAge: 20,
      preferredMaxAge: 30,
    },
    {
      username: "testUserDatingLikedBack",
      displayName: "Liked Back User",
      age: 27,
      gender: "Male",
      sexualOrientation: "Straight",
      location: GUARANTEED_TEST_CITIES[0], // Los Angeles
      preferredGender: JSON.stringify([{ gender: "Female", sexualOrientation: ["Straight"] }]),
      preferredSexualOrientation: "Straight",
      preferredMinAge: 22,
      preferredMaxAge: 32,
    },
  ];

  // Create 5 compatible users for testUserDatingDeckReady
  const compatibleUsersForDeck: Array<{ username: string; config: typeof testUserConfigs[0] }> = [];
  for (let i = 0; i < 5; i++) {
    compatibleUsersForDeck.push({
      username: `testUserDatingCompatible${i + 1}`,
      config: {
        username: `testUserDatingCompatible${i + 1}`,
        displayName: `Compatible User ${i + 1}`,
        age: 24 + i,
        gender: "Female",
        sexualOrientation: "Straight",
        location: GUARANTEED_TEST_CITIES[0], // Same city as DeckReady
        preferredGender: JSON.stringify([{ gender: "Male", sexualOrientation: ["Straight"] }]),
        preferredSexualOrientation: "Straight",
        preferredMinAge: 25,
        preferredMaxAge: 35,
      },
    });
  }

  // Create 5 users who liked testUserDatingPendingMatches
  const usersWhoLikedPending: Array<{ username: string; config: typeof testUserConfigs[0] }> = [];
  for (let i = 0; i < 5; i++) {
    usersWhoLikedPending.push({
      username: `testUserDatingLikedPending${i + 1}`,
      config: {
        username: `testUserDatingLikedPending${i + 1}`,
        displayName: `Liked Pending User ${i + 1}`,
        age: 24 + i,
        gender: "Male",
        sexualOrientation: "Straight",
        location: GUARANTEED_TEST_CITIES[0], // Same city
        preferredGender: JSON.stringify([{ gender: "Female", sexualOrientation: ["Straight"] }]),
        preferredSexualOrientation: "Straight",
        preferredMinAge: 22,
        preferredMaxAge: 30,
      },
    });
  }

  // Create 3 users for mutual matches with testUserDatingMutualMatches
  const mutualMatchUsers: Array<{ username: string; config: typeof testUserConfigs[0] }> = [];
  for (let i = 0; i < 3; i++) {
    mutualMatchUsers.push({
      username: `testUserDatingMutualMatch${i + 1}`,
      config: {
        username: `testUserDatingMutualMatch${i + 1}`,
        displayName: `Mutual Match ${i + 1}`,
        age: 28 + i,
        gender: i === 0 ? "Female" : "Male",
        sexualOrientation: i === 0 ? "Straight" : "Bisexual",
        location: GUARANTEED_TEST_CITIES[1], // San Francisco
        preferredGender: JSON.stringify([
          { gender: "Female", sexualOrientation: ["Straight", "Bisexual"] },
          { gender: "Male", sexualOrientation: ["Gay", "Bisexual"] },
          { gender: "Non-binary", sexualOrientation: [] }
        ]), // Open to any - set all genders
        preferredSexualOrientation: null,
        preferredMinAge: 25,
        preferredMaxAge: 40,
      },
    });
  }

  // Create 5 users that testUserDatingLikedBack has liked
  const usersLikedByLikedBack: Array<{ username: string; config: typeof testUserConfigs[0] }> = [];
  for (let i = 0; i < 5; i++) {
    usersLikedByLikedBack.push({
      username: `testUserDatingLikedByLikedBack${i + 1}`,
      config: {
        username: `testUserDatingLikedByLikedBack${i + 1}`,
        displayName: `Liked By LikedBack ${i + 1}`,
        age: 23 + i,
        gender: "Female",
        sexualOrientation: "Straight",
        location: GUARANTEED_TEST_CITIES[0], // Los Angeles
        preferredGender: JSON.stringify([{ gender: "Male", sexualOrientation: ["Straight"] }]),
        preferredSexualOrientation: "Straight",
        preferredMinAge: 25,
        preferredMaxAge: 35,
      },
    });
  }

  // Combine all test users
  const allTestUsers = [
    ...testUserConfigs.map(c => ({ username: c.username, config: c })),
    ...compatibleUsersForDeck,
    ...usersWhoLikedPending,
    ...mutualMatchUsers,
    ...usersLikedByLikedBack,
  ];

  // Create all test users
  for (const { username, config } of allTestUsers) {
    const userId = generateIdFromEntropySize(10);
    const email = `${username}${testDomain}`;
    const heightInches = 66; // 5'6" average
    const locationZip = config.location.zip || "90001"; // Default to LA zip
    const locationCity = config.location.city || "Los Angeles"; // Default to LA
    const locationLat = config.location.lat || 34.0522;
    const locationLon = config.location.lon || -118.2437;

    // Create user
    const userData: Prisma.UserCreateInput = {
      id: userId,
      username,
      email,
      displayName: config.displayName,
      passwordHash: hashedPassword,
      isVerified: true,
      isDatingActive: true,
      avatarUrl: `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`,
      bio: `Test user: ${config.displayName}`,
      createdAt: faker.date.between({
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    };
    usersToCreate.push(userData);

    // Create dating profile
    const profileId = generateIdFromEntropySize(10);
    const profileData: Prisma.userDatingProfileCreateInput = {
      id: profileId,
      user: { connect: { id: userId } },
      age: config.age,
      height: heightInches, // Store as inches (Int)
      gender: config.gender,
      sexualOrientation: config.sexualOrientation,
      religion: "Atheist",
      coronavirusVaccinated: "Yes",
      zipCode: locationZip, // Store zip code
      city: locationCity, // Store city name (geocoded)
      latitude: locationLat,
      longitude: locationLon,
    };
    profilesToCreate.push(profileData);

    // Create dating preferences
    const preferencesId = generateIdFromEntropySize(10);
    
    // preferredGender is already in JSON format from config, so use it directly
    const preferencesData: Prisma.userDatingPreferencesCreateInput = {
      id: preferencesId,
      users: { connect: { id: userId } },
      preferredMinAge: config.preferredMinAge,
      preferredMaxAge: config.preferredMaxAge,
      preferredMaxDistanceKm: 50, // 50km for test users
      preferredMinHeight: 60, // 5'0" in inches
      preferredMaxHeight: 72, // 6'0" in inches
      preferredGender: config.preferredGender, // Already JSON string from config
      preferredSexualOrientation: config.preferredSexualOrientation,
      preferredCoronavirusVaccinated: null,
      preferredReligions: [],
      preferredHasKids: null,
      preferredWantsKids: null,
      preferredEducation: [],
      preferredPoliticalViews: [],
      preferredDiet: [],
      preferredRelationshipType: [],
      preferredInstruments: [],
      preferredSkills: [],
      matchMusicTastes: false,
      exactMatchAllFilters: false,
      minimumMatchPercentage: 70,
      nonNegotiableFields: [],
    };
    preferencesToCreate.push(preferencesData);

    // Create photos
    for (let j = 0; j < 2; j++) {
      const photoId = generateIdFromEntropySize(10);
      const photoData: Prisma.userDatingPhotoCreateInput = {
        id: photoId,
        users: { connect: { id: userId } },
        url: `https://i.pravatar.cc/400?img=${faker.number.int({ min: 1, max: 70 })}`,
        isPrimary: j === 0,
      };
      photosToCreate.push(photoData);
    }

    testUsers[username] = { id: userId, userId, username };
    createdDatingUsers.push({
      id: userId,
      userId,
      username,
      isDatingActive: true,
    });
  }

  // Create relationships:
  // 1. Users who liked testUserDatingPendingMatches (pending matches)
  const pendingMatchesUserId = testUsers["testUserDatingPendingMatches"]?.id;
  if (pendingMatchesUserId) {
    for (let i = 0; i < 5; i++) {
      const likerUsername = `testUserDatingLikedPending${i + 1}`;
      const likerId = testUsers[likerUsername]?.id;
      if (likerId) {
        swipesToCreate.push({
          fromUserId: likerId,
          toUserId: pendingMatchesUserId,
          direction: "LIKE",
        });
      }
    }
  }

  // 2. Mutual matches for testUserDatingMutualMatches
  const mutualMatchesUserId = testUsers["testUserDatingMutualMatches"]?.id;
  if (mutualMatchesUserId) {
    for (let i = 0; i < 3; i++) {
      const matchUsername = `testUserDatingMutualMatch${i + 1}`;
      const matchId = testUsers[matchUsername]?.id;
      if (matchId) {
        // Create mutual swipes (both liked each other)
        swipesToCreate.push({
          fromUserId: mutualMatchesUserId,
          toUserId: matchId,
          direction: "LIKE",
        });
        swipesToCreate.push({
          fromUserId: matchId,
          toUserId: mutualMatchesUserId,
          direction: "LIKE",
        });
        // Create match
        matchesToCreate.push({
          user1Id: mutualMatchesUserId < matchId ? mutualMatchesUserId : matchId,
          user2Id: mutualMatchesUserId < matchId ? matchId : mutualMatchesUserId,
        });
      }
    }
  }

  // 3. Users that testUserDatingLikedBack has liked (waiting for responses)
  const likedBackUserId = testUsers["testUserDatingLikedBack"]?.id;
  if (likedBackUserId) {
    for (let i = 0; i < 5; i++) {
      const likedUsername = `testUserDatingLikedByLikedBack${i + 1}`;
      const likedId = testUsers[likedUsername]?.id;
      if (likedId) {
        swipesToCreate.push({
          fromUserId: likedBackUserId,
          toUserId: likedId,
          direction: "LIKE",
        });
      }
    }
  }

  console.log(`...Created ${allTestUsers.length} test users with predefined relationships.`);

  // First, create 50 users in guaranteed test cities (for easy testing)
  // Distribute evenly: ~8-9 users per city across 6 cities
  const usersPerGuaranteedCity = Math.floor(
    GUARANTEED_USERS_COUNT / GUARANTEED_TEST_CITIES.length,
  );
  const remainderGuaranteed = GUARANTEED_USERS_COUNT % GUARANTEED_TEST_CITIES.length;

  for (let cityIdx = 0; cityIdx < GUARANTEED_TEST_CITIES.length; cityIdx++) {
    const city = GUARANTEED_TEST_CITIES[cityIdx];
    const usersForThisCity =
      usersPerGuaranteedCity + (cityIdx < remainderGuaranteed ? 1 : 0);

    for (let j = 0; j < usersForThisCity; j++) {
      const userId = generateIdFromEntropySize(10);
      const username = `dating_user_${userIndex + 1}`;
      const email = `dating_user_${userIndex + 1}${testDomain}`;
      userIndex++;

      // Generate user data
      const age = faker.number.int({ min: MIN_AGE, max: MAX_AGE });
      const gender = faker.helpers.arrayElement(GENDERS);
      const sexualOrientation = faker.helpers.arrayElement(SEXUAL_ORIENTATIONS);
      const heightInches = faker.number.int({
        min: MIN_HEIGHT_INCHES,
        max: MAX_HEIGHT_INCHES,
      });
      const religion = faker.helpers.arrayElement(RELIGIONS);
      const vaccinated = faker.helpers.arrayElement(VACCINATION_STATUS);
      const locationZip = city.zip || "90001"; // Default to LA zip if missing
      const locationCity = city.city; // City name for display
      const locationLat = city.lat;
      const locationLon = city.lon;

      // Create user
      const userData: Prisma.UserCreateInput = {
        id: userId,
        username,
        email,
        displayName: faker.person.fullName(),
        passwordHash: hashedPassword,
        isVerified: true,
        isDatingActive: true,
        avatarUrl: `https://i.pravatar.cc/150?img=${faker.number.int({
          min: 1,
          max: 70,
        })}`,
        bio: faker.lorem.sentence(),
        createdAt: faker.date.between({
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          to: new Date(),
        }),
      };
      usersToCreate.push(userData);

      // Create dating profile with random optional fields
      // Randomly decide profile completeness (0-100% filled)
      const profileCompleteness = faker.number.float({ min: 0.3, max: 1.0 }); // 30-100% complete
      
      const profileId = generateIdFromEntropySize(10);
      const hasKids = faker.datatype.boolean({ probability: profileCompleteness * 0.7 })
        ? faker.datatype.boolean()
        : null;
      const profileData: Prisma.userDatingProfileCreateInput = {
        id: profileId,
        user: { connect: { id: userId } },
        age,
        height: heightInches, // Store as inches (Int)
        gender,
        sexualOrientation,
        religion,
        coronavirusVaccinated: vaccinated,
        zipCode: locationZip, // Store zip code
        city: locationCity, // Store city name (geocoded)
        latitude: locationLat,
        longitude: locationLon,
        // Randomly populate optional fields based on completeness
        bio: faker.datatype.boolean({ probability: profileCompleteness * 0.8 }) 
          ? faker.lorem.paragraph({ min: 1, max: 3 }) 
          : null,
        hasKids,
        smokes: faker.datatype.boolean({ probability: profileCompleteness * 0.9 })
          ? faker.helpers.arrayElement(SMOKES_OPTIONS)
          : null,
        drinks: faker.datatype.boolean({ probability: profileCompleteness * 0.9 })
          ? faker.helpers.arrayElement(DRINKS_OPTIONS)
          : null,
        activity: faker.datatype.boolean({ probability: profileCompleteness * 0.8 })
          ? faker.helpers.arrayElement(ACTIVITY_OPTIONS)
          : null,
        education: faker.datatype.boolean({ probability: profileCompleteness * 0.7 })
          ? faker.helpers.arrayElement(EDUCATION_LEVELS)
          : null,
        wantsKids: faker.datatype.boolean({ probability: profileCompleteness * 0.6 })
          ? faker.helpers.arrayElement(["yes", "no", "maybe", "not_sure"])
          : null,
        politicalViews: faker.datatype.boolean({ probability: profileCompleteness * 0.5 })
          ? faker.helpers.arrayElement(POLITICAL_VIEWS)
          : null,
        diet: faker.datatype.boolean({ probability: profileCompleteness * 0.4 })
          ? faker.helpers.arrayElement(DIET_OPTIONS)
          : null,
        relationshipType: faker.datatype.boolean({ probability: profileCompleteness * 0.5 })
          ? faker.helpers.arrayElement(RELATIONSHIP_TYPES)
          : null,
        job: faker.datatype.boolean({ probability: profileCompleteness * 0.75 })
          ? faker.person.jobTitle()
          : null,
        pets: faker.datatype.boolean({ probability: profileCompleteness * 0.6 })
          ? faker.helpers.arrayElement(["Dog", "Cat", "Bird", "Fish", "Rabbit", "Hamster", "Snake", "Lizard", "None"])
          : null,
        interests: faker.datatype.boolean({ probability: profileCompleteness * 0.85 })
          ? faker.helpers.arrayElements(INTERESTS_OPTIONS, { min: 1, max: Math.min(8, Math.floor(profileCompleteness * 10)) })
          : [],
      };
      profilesToCreate.push(profileData);

      // Create dating preferences
      const preferencesId = generateIdFromEntropySize(10);
      const preferredMinAge = Math.max(MIN_AGE, age - 5);
      const preferredMaxAge = Math.min(MAX_AGE, age + 10);
      const preferredGender =
        gender === "Non-binary"
          ? null
          : faker.helpers.arrayElement([
              gender,
              null,
              faker.helpers.arrayElement(GENDERS),
            ]);
      const preferredSexualOrientation = faker.helpers.arrayElement([
        sexualOrientation,
        null,
        faker.helpers.arrayElement(SEXUAL_ORIENTATIONS),
      ]);

      const preferencesData: Prisma.userDatingPreferencesCreateInput = {
        id: preferencesId,
        users: { connect: { id: userId } },
        preferredMinAge,
        preferredMaxAge,
        preferredMaxDistanceKm: faker.helpers.arrayElement([
          25, 50, 100, 150, 200,
        ]),
        preferredMinHeight: Math.max(MIN_HEIGHT_INCHES, heightInches - 10),
        preferredMaxHeight: Math.min(MAX_HEIGHT_INCHES, heightInches + 15),
        preferredGender,
        preferredSexualOrientation,
        preferredCoronavirusVaccinated: faker.helpers.arrayElement([
          vaccinated,
          null,
          faker.helpers.arrayElement(VACCINATION_STATUS),
        ]),
        preferredReligions: faker.helpers.arrayElements(RELIGIONS, {
          min: 0,
          max: 3,
        }),
        preferredHasKids: faker.helpers.arrayElement([
          hasKids !== null ? (hasKids ? "Yes" : "No") : null,
          null,
          faker.helpers.arrayElement(["Yes", "No", ""]),
        ]),
        preferredWantsKids: faker.datatype.boolean({ probability: 0.6 })
          ? faker.helpers.arrayElement(["yes", "no", "maybe", "any"])
          : null,
        preferredEducation: faker.datatype.boolean({ probability: 0.5 })
          ? faker.helpers.arrayElements(EDUCATION_LEVELS, { min: 1, max: 3 })
          : [],
        preferredPoliticalViews: faker.datatype.boolean({ probability: 0.4 })
          ? faker.helpers.arrayElements(POLITICAL_VIEWS, { min: 1, max: 3 })
          : [],
        preferredDiet: faker.datatype.boolean({ probability: 0.3 })
          ? faker.helpers.arrayElements(DIET_OPTIONS, { min: 1, max: 2 })
          : [],
        preferredRelationshipType: faker.datatype.boolean({ probability: 0.4 })
          ? faker.helpers.arrayElements(RELATIONSHIP_TYPES, { min: 1, max: 2 })
          : [],
        preferredInstruments: [],
        preferredSkills: [],
        matchMusicTastes: faker.datatype.boolean(),
        exactMatchAllFilters: faker.datatype.boolean({ probability: 0.2 }), // 20% want exact match
        minimumMatchPercentage: faker.number.int({ min: 70, max: 100 }),
        nonNegotiableFields: faker.datatype.boolean({ probability: 0.3 })
          ? faker.helpers.arrayElements([
              "height",
              "religion",
              "education",
              "politicalViews",
              "diet",
              "relationshipType",
              "activity",
            ], { min: 1, max: 3 })
          : [],
      };
      preferencesToCreate.push(preferencesData);

      // Create variable number of photos per user (MIN_PHOTOS to MAX_PHOTOS)
      const photoCount = faker.number.int({ min: MIN_PHOTOS, max: MAX_PHOTOS });
      for (let k = 0; k < photoCount; k++) {
        const photoId = generateIdFromEntropySize(10);
        const photoData: Prisma.userDatingPhotoCreateInput = {
          id: photoId,
          users: { connect: { id: userId } },
          url: `https://i.pravatar.cc/400?img=${faker.number.int({
            min: 1,
            max: 70,
          })}`,
          isPrimary: k === 0,
        };
        photosToCreate.push(photoData);
      }

      createdDatingUsers.push({
        id: userId,
        userId,
        username,
        isDatingActive: true,
      });
    }
  }

  // Then, create remaining users randomly distributed across mainland cities
  for (let i = 0; i < RANDOM_USERS_COUNT; i++) {
    const userId = generateIdFromEntropySize(10);
    const city = faker.helpers.arrayElement(RANDOM_MAINLAND_CITIES);
    const username = `dating_user_${userIndex + 1}`;
    const email = `dating_user_${userIndex + 1}${testDomain}`;
    userIndex++;

    // Generate user data
    const age = faker.number.int({ min: MIN_AGE, max: MAX_AGE });
    const gender = faker.helpers.arrayElement(GENDERS);
    const sexualOrientation = faker.helpers.arrayElement(SEXUAL_ORIENTATIONS);
    const heightInches = faker.number.int({
      min: MIN_HEIGHT_INCHES,
      max: MAX_HEIGHT_INCHES,
    });
    const religion = faker.helpers.arrayElement(RELIGIONS);
    const vaccinated = faker.helpers.arrayElement(VACCINATION_STATUS);
    const locationZip = city.zip || "90001"; // Default to LA zip if missing
    const locationCity = city.city; // City name for display
    const locationLat = city.lat;
    const locationLon = city.lon;

    // Create user
    const userData: Prisma.UserCreateInput = {
      id: userId,
      username,
      email,
      displayName: faker.person.fullName(),
      passwordHash: hashedPassword,
      isVerified: true,
      isDatingActive: true, // Enable dating feature
      avatarUrl: `https://i.pravatar.cc/150?img=${faker.number.int({
        min: 1,
        max: 70,
      })}`,
      bio: faker.lorem.sentence(),
      createdAt: faker.date.between({
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    };
    usersToCreate.push(userData);

    // Create dating profile with random optional fields
    // Randomly decide profile completeness (0-100% filled)
    const profileCompleteness = faker.number.float({ min: 0.3, max: 1.0 }); // 30-100% complete
    
    const profileId = generateIdFromEntropySize(10);
    const hasKids = faker.datatype.boolean({ probability: profileCompleteness * 0.7 })
      ? faker.datatype.boolean()
      : null;
    const profileData: Prisma.userDatingProfileCreateInput = {
      id: profileId,
      user: { connect: { id: userId } },
      age,
      height: heightInches, // Store as inches (Int)
      gender,
      sexualOrientation,
      religion,
      coronavirusVaccinated: vaccinated,
      zipCode: locationZip, // Store zip code
      city: locationCity, // Store city name (geocoded)
      latitude: locationLat,
      longitude: locationLon,
      // Randomly populate optional fields based on completeness
      bio: faker.datatype.boolean({ probability: profileCompleteness * 0.8 }) 
        ? faker.lorem.paragraph({ min: 1, max: 3 }) 
        : null,
      hasKids,
      smokes: faker.datatype.boolean({ probability: profileCompleteness * 0.9 })
        ? faker.helpers.arrayElement(SMOKES_OPTIONS)
        : null,
      drinks: faker.datatype.boolean({ probability: profileCompleteness * 0.9 })
        ? faker.helpers.arrayElement(DRINKS_OPTIONS)
        : null,
      activity: faker.datatype.boolean({ probability: profileCompleteness * 0.8 })
        ? faker.helpers.arrayElement(ACTIVITY_OPTIONS)
        : null,
        education: faker.datatype.boolean({ probability: profileCompleteness * 0.7 })
          ? faker.helpers.arrayElement(EDUCATION_LEVELS)
          : null,
        wantsKids: faker.datatype.boolean({ probability: profileCompleteness * 0.6 })
          ? faker.helpers.arrayElement(["yes", "no", "maybe", "not_sure"])
          : null,
        politicalViews: faker.datatype.boolean({ probability: profileCompleteness * 0.5 })
          ? faker.helpers.arrayElement(POLITICAL_VIEWS)
          : null,
        diet: faker.datatype.boolean({ probability: profileCompleteness * 0.4 })
          ? faker.helpers.arrayElement(DIET_OPTIONS)
          : null,
        relationshipType: faker.datatype.boolean({ probability: profileCompleteness * 0.5 })
          ? faker.helpers.arrayElement(RELATIONSHIP_TYPES)
          : null,
        job: faker.datatype.boolean({ probability: profileCompleteness * 0.75 })
          ? faker.person.jobTitle()
          : null,
        pets: faker.datatype.boolean({ probability: profileCompleteness * 0.6 })
          ? faker.helpers.arrayElement(["Dog", "Cat", "Bird", "Fish", "Rabbit", "Hamster", "Snake", "Lizard", "None"])
          : null,
        interests: faker.datatype.boolean({ probability: profileCompleteness * 0.85 })
          ? faker.helpers.arrayElements(INTERESTS_OPTIONS, { min: 1, max: Math.min(8, Math.floor(profileCompleteness * 10)) })
          : [],
    };
    profilesToCreate.push(profileData);

    // Create dating preferences
    const preferencesId = generateIdFromEntropySize(10);
    const preferredMinAge = Math.max(MIN_AGE, age - 5);
    const preferredMaxAge = Math.min(MAX_AGE, age + 10);
    const preferredGender =
      gender === "Non-binary"
        ? null
        : faker.helpers.arrayElement([
            gender,
            null,
            faker.helpers.arrayElement(GENDERS),
          ]);
    const preferredSexualOrientation = faker.helpers.arrayElement([
      sexualOrientation,
      null,
      faker.helpers.arrayElement(SEXUAL_ORIENTATIONS),
    ]);

    const preferencesData: Prisma.userDatingPreferencesCreateInput = {
      id: preferencesId,
      users: { connect: { id: userId } },
      preferredMinAge,
      preferredMaxAge,
      preferredMaxDistanceKm: faker.helpers.arrayElement([
        25, 50, 100, 150, 200,
      ]),
      preferredMinHeight: Math.max(MIN_HEIGHT_INCHES, heightInches - 10),
      preferredMaxHeight: Math.min(MAX_HEIGHT_INCHES, heightInches + 15),
      preferredGender,
      preferredSexualOrientation,
      preferredCoronavirusVaccinated: faker.helpers.arrayElement([
        vaccinated,
        null,
        faker.helpers.arrayElement(VACCINATION_STATUS),
      ]),
        preferredReligions: faker.helpers.arrayElements(RELIGIONS, {
          min: 0,
          max: 3,
        }),
        preferredHasKids: faker.helpers.arrayElement([
          hasKids !== null ? (hasKids ? "Yes" : "No") : null,
          null,
          faker.helpers.arrayElement(["Yes", "No", ""]),
        ]),
        preferredWantsKids: faker.datatype.boolean({ probability: 0.6 })
          ? faker.helpers.arrayElement(["yes", "no", "maybe", "any"])
          : null,
        preferredEducation: faker.datatype.boolean({ probability: 0.5 })
          ? faker.helpers.arrayElements(EDUCATION_LEVELS, { min: 1, max: 3 })
          : [],
        preferredPoliticalViews: faker.datatype.boolean({ probability: 0.4 })
          ? faker.helpers.arrayElements(POLITICAL_VIEWS, { min: 1, max: 3 })
          : [],
        preferredDiet: faker.datatype.boolean({ probability: 0.3 })
          ? faker.helpers.arrayElements(DIET_OPTIONS, { min: 1, max: 2 })
          : [],
        preferredRelationshipType: faker.datatype.boolean({ probability: 0.4 })
          ? faker.helpers.arrayElements(RELATIONSHIP_TYPES, { min: 1, max: 2 })
          : [],
        preferredInstruments: [], // Can be populated if needed
        preferredSkills: [], // Can be populated if needed
        matchMusicTastes: faker.datatype.boolean(),
        exactMatchAllFilters: faker.datatype.boolean({ probability: 0.2 }), // 20% want exact match
        minimumMatchPercentage: faker.number.int({ min: 70, max: 100 }),
        nonNegotiableFields: faker.datatype.boolean({ probability: 0.3 })
          ? faker.helpers.arrayElements([
              "height",
              "religion",
              "education",
              "politicalViews",
              "diet",
              "relationshipType",
              "activity",
            ], { min: 1, max: 3 })
          : [],
    };
    preferencesToCreate.push(preferencesData);

    // Create 1-4 photos per user
    const photoCount = faker.number.int({ min: 1, max: 4 });
    for (let k = 0; k < photoCount; k++) {
      const photoId = generateIdFromEntropySize(10);
      const photoData: Prisma.userDatingPhotoCreateInput = {
        id: photoId,
        users: { connect: { id: userId } },
        url: `https://i.pravatar.cc/400?img=${faker.number.int({
          min: 1,
          max: 70,
        })}`,
        isPrimary: k === 0,
      };
      photosToCreate.push(photoData);
    }

    createdDatingUsers.push({
      id: userId,
      userId,
      username,
      isDatingActive: true,
    });
  }

  try {
    // Create users
    console.log(`Creating ${usersToCreate.length} dating users...`);
    await tx.user.createMany({
      data: usersToCreate,
      skipDuplicates: true,
    });
    console.log(`...${usersToCreate.length} users created.`);

    // Fetch the actually created users (in case some were skipped due to duplicates)
    const usernamesToCreate = usersToCreate.map((u) => u.username!);
    const actualCreatedUsers = await tx.user.findMany({
      where: {
        username: { in: usernamesToCreate },
      },
      select: { id: true, username: true },
    });
    
    // Create a mapping from attempted user ID to actual user ID (by username)
    const userIdMap = new Map<string, string>();
    type UserWithIdAndUsername = { id: string; username: string };
    for (const attemptedUser of usersToCreate) {
      const actualUser = actualCreatedUsers.find((u: UserWithIdAndUsername) => u.username === attemptedUser.username);
      if (actualUser) {
        userIdMap.set(attemptedUser.id!, actualUser.id);
      }
    }
    
    const createdUserIds = new Set(actualCreatedUsers.map((u: UserWithIdAndUsername) => u.id));
    console.log(`...Fetched ${actualCreatedUsers.length} actual users from DB.`);

    // Filter profiles, preferences, and photos to only include users that were actually created
    // and map their user IDs to the actual IDs from the database
    const validProfiles = profilesToCreate
      .map((p) => {
        const attemptedUserId = (p.user as { connect: { id: string } }).connect.id;
        const actualUserId = userIdMap.get(attemptedUserId);
        if (!actualUserId) return null;
        return { ...p, actualUserId };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
      
    const validPreferences = preferencesToCreate
      .map((p) => {
        const attemptedUserId = (p.users as { connect: { id: string } }).connect.id;
        const actualUserId = userIdMap.get(attemptedUserId);
        if (!actualUserId) return null;
        return { ...p, actualUserId };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
      
    const validPhotos = photosToCreate
      .map((p) => {
        const attemptedUserId = (p.users as { connect: { id: string } }).connect.id;
        const actualUserId = userIdMap.get(attemptedUserId);
        if (!actualUserId) return null;
        return { ...p, actualUserId };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (validProfiles.length < profilesToCreate.length) {
      console.log(
        `...Filtered out ${profilesToCreate.length - validProfiles.length} profiles for users that weren't created (duplicates).`,
      );
    }

    // Create dating profiles using batch operations (convert relations to direct IDs)
    console.log(`Creating ${validProfiles.length} dating profiles...`);
    const profilesData = validProfiles.map((p) => {
      const userId = p.actualUserId;
      return {
        id: p.id,
        userId,
        age: p.age,
        height: p.height,
        gender: p.gender,
        sexualOrientation: p.sexualOrientation,
        religion: p.religion,
        coronavirusVaccinated: p.coronavirusVaccinated,
        zipCode: p.zipCode,
        city: p.city,
        latitude: p.latitude,
        longitude: p.longitude,
        bio: p.bio,
        hasKids: p.hasKids,
        smokes: p.smokes,
        drinks: p.drinks,
        activity: p.activity,
        education: p.education,
        wantsKids: p.wantsKids,
        politicalViews: p.politicalViews,
        diet: p.diet,
        relationshipType: p.relationshipType,
        job: p.job,
        pets: p.pets,
        interests: p.interests || [],
      };
    });
    
    // Batch create profiles in chunks of 50
    const profileBatchSize = 50;
    for (let i = 0; i < profilesData.length; i += profileBatchSize) {
      const batch = profilesData.slice(i, i + profileBatchSize);
      await tx.userDatingProfile.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
    console.log(`...${validProfiles.length} profiles created.`);

    // Create dating preferences using batch operations
    console.log(`Creating ${validPreferences.length} dating preferences...`);
    const preferencesData = validPreferences.map((p) => {
      const userId = p.actualUserId;
      return {
        id: p.id,
        userId,
        preferredMinAge: p.preferredMinAge,
        preferredMaxAge: p.preferredMaxAge,
        preferredMaxDistanceKm: p.preferredMaxDistanceKm,
        preferredMinHeight: p.preferredMinHeight,
        preferredMaxHeight: p.preferredMaxHeight,
        preferredGender: p.preferredGender,
        preferredSexualOrientation: p.preferredSexualOrientation,
        preferredCoronavirusVaccinated: p.preferredCoronavirusVaccinated,
        preferredReligions: p.preferredReligions || [],
        preferredHasKids: p.preferredHasKids,
        preferredWantsKids: p.preferredWantsKids,
        preferredEducation: p.preferredEducation || [],
        preferredPoliticalViews: p.preferredPoliticalViews || [],
        preferredDiet: p.preferredDiet || [],
        preferredRelationshipType: p.preferredRelationshipType || [],
        preferredInstruments: p.preferredInstruments || [],
        preferredSkills: p.preferredSkills || [],
        matchMusicTastes: p.matchMusicTastes,
        exactMatchAllFilters: p.exactMatchAllFilters,
        minimumMatchPercentage: p.minimumMatchPercentage,
        nonNegotiableFields: p.nonNegotiableFields || [],
      };
    });
    
    // Batch create preferences in chunks of 50
    const preferencesBatchSize = 50;
    for (let i = 0; i < preferencesData.length; i += preferencesBatchSize) {
      const batch = preferencesData.slice(i, i + preferencesBatchSize);
      await tx.userDatingPreferences.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
    console.log(`...${validPreferences.length} preferences created.`);

    // Create photos using batch operations
    console.log(`Creating ${validPhotos.length} user photos...`);
    const photosData = validPhotos.map((p) => {
      const userId = p.actualUserId;
      return {
        id: p.id,
        userId,
        url: p.url,
        isPrimary: p.isPrimary,
      };
    });
    
    // Batch create photos in chunks of 100
    const photosBatchSize = 100;
    for (let i = 0; i < photosData.length; i += photosBatchSize) {
      const batch = photosData.slice(i, i + photosBatchSize);
      await tx.userDatingPhoto.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
    console.log(`...${validPhotos.length} photos created.`);

    // Create swipes (likes/dislikes) for test users
    // Map swipe user IDs to actual user IDs from database
    if (swipesToCreate.length > 0) {
      console.log(`Creating ${swipesToCreate.length} swipes for test users...`);
      let swipeCount = 0;
      for (const swipe of swipesToCreate) {
        const actualFromUserId = userIdMap.get(swipe.fromUserId) || swipe.fromUserId;
        const actualToUserId = userIdMap.get(swipe.toUserId) || swipe.toUserId;
        
        // Skip if either user ID doesn't exist in the database
        if (!createdUserIds.has(actualFromUserId) || !createdUserIds.has(actualToUserId)) {
          continue;
        }
        
        try {
          await tx.swipe.create({
            data: {
              id: generateIdFromEntropySize(10),
              fromUserId: actualFromUserId,
              toUserId: actualToUserId,
              direction: swipe.direction,
              createdAt: new Date(),
            },
          });
          swipeCount++;
        } catch (error) {
          // Skip if swipe already exists or other error
          console.warn(`Swipe already exists or error: ${(error as Error).message}`);
        }
      }
      console.log(`...${swipeCount} swipes created.`);
    }

    // Create matches for test users
    // Map match user IDs to actual user IDs from database
    if (matchesToCreate.length > 0) {
      console.log(`Creating ${matchesToCreate.length} matches for test users...`);
      const createdMatchIds: string[] = [];
      let matchCount = 0;
      for (const match of matchesToCreate) {
        const actualUser1Id = userIdMap.get(match.user1Id) || match.user1Id;
        const actualUser2Id = userIdMap.get(match.user2Id) || match.user2Id;
        
        // Skip if either user ID doesn't exist in the database
        if (!createdUserIds.has(actualUser1Id) || !createdUserIds.has(actualUser2Id)) {
          continue;
        }
        
        try {
          const matchId = generateIdFromEntropySize(10);
          await tx.match.create({
            data: {
              id: matchId,
              user1Id: actualUser1Id,
              user2Id: actualUser2Id,
              createdAt: new Date(),
            },
          });
          createdMatchIds.push(matchId);
          matchCount++;
        } catch (error) {
          // Skip if match already exists
          console.warn(`Match already exists or error: ${(error as Error).message}`);
        }
      }
      console.log(`...${matchCount} matches created.`);

      // Create match notifications for all created matches
      if (createdMatchIds.length > 0) {
        console.log(`Creating ${createdMatchIds.length * 2} match notifications...`);
        const notificationsToCreate = [];
        for (let i = 0; i < matchesToCreate.length; i++) {
          const match = matchesToCreate[i];
          const matchId = createdMatchIds[i];
          if (matchId) {
            // Create notification for user1
            notificationsToCreate.push({
              id: generateIdFromEntropySize(10),
              recipientId: match.user1Id,
              issuerId: match.user2Id,
              type: NotificationType.MATCH,
              matchId: matchId,
              read: false,
              createdAt: new Date(),
            });
            // Create notification for user2
            notificationsToCreate.push({
              id: generateIdFromEntropySize(10),
              recipientId: match.user2Id,
              issuerId: match.user1Id,
              type: NotificationType.MATCH,
              matchId: matchId,
              read: false,
              createdAt: new Date(),
            });
          }
        }
        
        if (notificationsToCreate.length > 0) {
          try {
            await tx.notification.createMany({
              data: notificationsToCreate,
              skipDuplicates: true,
            });
            console.log(`...${notificationsToCreate.length} match notifications created.`);
          } catch (error) {
            console.warn(`Error creating match notifications: ${(error as Error).message}`);
          }
        }
      }
    }

    console.log(
      `Dating seeding complete: ${createdDatingUsers.length} users with profiles, preferences, photos, swipes, and matches.`,
    );
    console.log("\nTest Users Created:");
    console.log("  - testUserDatingDeckReady: Has 5 compatible users ready in deck");
    console.log("  - testUserDatingPendingMatches: Has 5 users who liked them (pending matches)");
    console.log("  - testUserDatingMutualMatches: Has 3 mutual matches");
    console.log("  - testUserDatingNoMatches: Fresh user with no activity");
    console.log("  - testUserDatingLikedBack: Liked 5 users, waiting for responses");

    return createdDatingUsers;
  } catch (error) {
    console.error("Error during dating profile seeding:", error);
    return [];
  }
}

