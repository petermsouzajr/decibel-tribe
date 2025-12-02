import { PrismaClient, Prisma } from "@prisma/client";
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
 * Testers can use Travel Mode to set their location to any of these cities
 * to find guaranteed users for testing.
 */

// Major cities with guaranteed user placement (for testing)
const GUARANTEED_TEST_CITIES = [
  { city: "Los Angeles", state: "CA", lat: 34.0522, lon: -118.2437 },
  { city: "San Francisco", state: "CA", lat: 37.7749, lon: -122.4194 },
  { city: "Chicago", state: "IL", lat: 41.8781, lon: -87.6298 },
  { city: "New York", state: "NY", lat: 40.7128, lon: -74.006 },
  { city: "Austin", state: "TX", lat: 30.2672, lon: -97.7431 },
  { city: "Honolulu", state: "HI", lat: 21.3099, lon: -157.8581 },
];

const USERS_PER_GUARANTEED_CITY = 10; // 6 cities × 10 users = 60 users (we'll use 50)

// Additional US cities for random distribution (mainland only)
const RANDOM_MAINLAND_CITIES = [
  { city: "Houston", state: "TX", lat: 29.7604, lon: -95.3698 },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lon: -112.074 },
  { city: "Philadelphia", state: "PA", lat: 39.9526, lon: -75.1652 },
  { city: "San Antonio", state: "TX", lat: 29.4241, lon: -98.4936 },
  { city: "San Diego", state: "CA", lat: 32.7157, lon: -117.1611 },
  { city: "Dallas", state: "TX", lat: 32.7767, lon: -96.797 },
  { city: "San Jose", state: "CA", lat: 37.3382, lon: -121.8863 },
  { city: "Jacksonville", state: "FL", lat: 30.3322, lon: -81.6557 },
  { city: "Fort Worth", state: "TX", lat: 32.7555, lon: -97.3308 },
  { city: "Columbus", state: "OH", lat: 39.9612, lon: -82.9988 },
  { city: "Charlotte", state: "NC", lat: 35.2271, lon: -80.8431 },
  { city: "Indianapolis", state: "IN", lat: 39.7684, lon: -86.1581 },
  { city: "Seattle", state: "WA", lat: 47.6062, lon: -122.3321 },
  { city: "Denver", state: "CO", lat: 39.7392, lon: -104.9903 },
  { city: "Washington", state: "DC", lat: 38.9072, lon: -77.0369 },
  { city: "Boston", state: "MA", lat: 42.3601, lon: -71.0589 },
  { city: "El Paso", state: "TX", lat: 31.7619, lon: -106.485 },
  { city: "Nashville", state: "TN", lat: 36.1627, lon: -86.7816 },
  { city: "Detroit", state: "MI", lat: 42.3314, lon: -83.0458 },
  { city: "Oklahoma City", state: "OK", lat: 35.4676, lon: -97.5164 },
  { city: "Portland", state: "OR", lat: 45.5152, lon: -122.6784 },
  { city: "Las Vegas", state: "NV", lat: 36.1699, lon: -115.1398 },
  { city: "Memphis", state: "TN", lat: 35.1495, lon: -90.049 },
  { city: "Louisville", state: "KY", lat: 38.2527, lon: -85.7585 },
  { city: "Baltimore", state: "MD", lat: 39.2904, lon: -76.6122 },
  { city: "Milwaukee", state: "WI", lat: 43.0389, lon: -87.9065 },
  { city: "Albuquerque", state: "NM", lat: 35.0844, lon: -106.6504 },
  { city: "Tucson", state: "AZ", lat: 32.2226, lon: -110.9747 },
  { city: "Fresno", state: "CA", lat: 36.7378, lon: -119.7871 },
  { city: "Sacramento", state: "CA", lat: 38.5816, lon: -121.4944 },
  { city: "Kansas City", state: "MO", lat: 39.0997, lon: -94.5786 },
  { city: "Mesa", state: "AZ", lat: 33.4152, lon: -111.8315 },
  { city: "Atlanta", state: "GA", lat: 33.749, lon: -84.388 },
  { city: "Omaha", state: "NE", lat: 41.2565, lon: -95.9345 },
  { city: "Colorado Springs", state: "CO", lat: 38.8339, lon: -104.8214 },
  { city: "Raleigh", state: "NC", lat: 35.7796, lon: -78.6382 },
  { city: "Virginia Beach", state: "VA", lat: 36.8529, lon: -75.978 },
  { city: "Miami", state: "FL", lat: 25.7617, lon: -80.1918 },
  { city: "Oakland", state: "CA", lat: 37.8044, lon: -122.2712 },
  { city: "Minneapolis", state: "MN", lat: 44.9778, lon: -93.265 },
  { city: "Tulsa", state: "OK", lat: 36.154, lon: -95.9928 },
  { city: "Cleveland", state: "OH", lat: 41.4993, lon: -81.6944 },
  { city: "Wichita", state: "KS", lat: 37.6872, lon: -97.3301 },
  { city: "Arlington", state: "TX", lat: 32.7357, lon: -97.1081 },
  { city: "New Orleans", state: "LA", lat: 29.9511, lon: -90.0715 },
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

// Height range in inches (for US)
const MIN_HEIGHT_INCHES = 36; // 3'0"
const MAX_HEIGHT_INCHES = 94; // 8'0"

// Age range
const MIN_AGE = 18;
const MAX_AGE = 130;

/**
 * Deletes existing dating test users from database and StreamChat
 * This ensures clean state before seeding new dating users
 */
async function deleteDatingTestUsers(
  tx: PrismaClient | any,
  streamClient: any,
): Promise<string[]> {
  console.log("Deleting existing dating test users...");

  try {
    // Find all dating users by username pattern or email domain
    const datingUsers = await tx.user.findMany({
      where: {
        OR: [
          { username: { startsWith: "dating_user_" } },
          { email: { endsWith: "@test.com" } },
        ],
      },
      select: { id: true },
    });

    const userIds = datingUsers.map((user: { id: string }) => user.id);

    if (userIds.length === 0) {
      console.log("...No existing dating test users found to delete.");
      return [];
    }

    // Delete related dating data first
    await tx.user_photos.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.user_dating_preferences.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.user_dating_profile.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.dating_location_overrides.deleteMany({
      where: { userId: { in: userIds } },
    });
    await tx.swipes.deleteMany({
      where: {
        OR: [
          { fromUserId: { in: userIds } },
          { toUserId: { in: userIds } },
        ],
      },
    });
    await tx.matches.deleteMany({
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

    // Delete from StreamChat
    if (streamClient && userIds.length > 0) {
      try {
        const streamUsers = await streamClient.queryUsers({
          id: { $in: userIds },
        });

        if (streamUsers.users.length > 0) {
          let deletedCount = 0;
          for (const user of streamUsers.users) {
            try {
              await streamClient.deleteUser(user.id, { hardDelete: true });
              deletedCount++;
            } catch (error) {
              console.error(
                `Failed to delete user ${user.id} from StreamChat:`,
                (error as Error).message,
              );
            }
          }
          console.log(
            `...${deletedCount} dating users deleted from StreamChat.`,
          );
        }
      } catch (error) {
        console.error(
          "Error deleting dating users from StreamChat:",
          (error as Error).message,
        );
      }
    }

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

  // First, delete existing dating test users
  await deleteDatingTestUsers(tx, streamClient);

  console.log(`Seeding ${DATING_USER_COUNT} dating profiles...`);

  const hashedPassword = await hasher(cypressEnv.password as string); // Default password for test users
  const createdDatingUsers: CreatedDatingUser[] = [];
  const usersToCreate: Prisma.UserCreateInput[] = [];
  const profilesToCreate: Prisma.user_dating_profileCreateInput[] = [];
  const preferencesToCreate: Prisma.user_dating_preferencesCreateInput[] = [];
  const photosToCreate: Prisma.user_photosCreateInput[] = [];

  let userIndex = 0;

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
      const email = `dating_user_${userIndex + 1}@test.com`;
      userIndex++;

      // Generate user data
      const age = faker.number.int({ min: MIN_AGE, max: MAX_AGE });
      const gender = faker.helpers.arrayElement(GENDERS);
      const sexualOrientation = faker.helpers.arrayElement(SEXUAL_ORIENTATIONS);
      const heightInches = faker.number.int({
        min: MIN_HEIGHT_INCHES,
        max: MAX_HEIGHT_INCHES,
      });
      const heightCm = heightInches * 2.54;
      const religion = faker.helpers.arrayElement(RELIGIONS);
      const vaccinated = faker.helpers.arrayElement(VACCINATION_STATUS);
      const location = `${city.city}, ${city.state}`;

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

      // Create dating profile
      const profileId = generateIdFromEntropySize(10);
      const profileData: Prisma.user_dating_profileCreateInput = {
        id: profileId,
        user: { connect: { id: userId } },
        age,
        height: heightCm,
        gender,
        sexualOrientation,
        religion,
        coronavirusVaccinated: vaccinated,
        location,
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

      const preferencesData: Prisma.user_dating_preferencesCreateInput = {
        id: preferencesId,
        users: { connect: { id: userId } },
        preferredMinAge,
        preferredMaxAge,
        preferredMaxDistanceKm: faker.helpers.arrayElement([
          25, 50, 100, 150, 200,
        ]),
        preferredMinHeight: Math.max(MIN_HEIGHT_INCHES * 2.54, heightCm - 10),
        preferredMaxHeight: Math.min(MAX_HEIGHT_INCHES * 2.54, heightCm + 15),
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
        preferredInstruments: [],
        preferredSkills: [],
        matchMusicTastes: faker.datatype.boolean(),
      };
      preferencesToCreate.push(preferencesData);

      // Create 1-4 photos per user
      const photoCount = faker.number.int({ min: 1, max: 4 });
      for (let k = 0; k < photoCount; k++) {
        const photoId = generateIdFromEntropySize(10);
        const photoData: Prisma.user_photosCreateInput = {
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
    const email = `dating_user_${userIndex + 1}@test.com`;
    userIndex++;

    // Generate user data
    const age = faker.number.int({ min: MIN_AGE, max: MAX_AGE });
    const gender = faker.helpers.arrayElement(GENDERS);
    const sexualOrientation = faker.helpers.arrayElement(SEXUAL_ORIENTATIONS);
    const heightInches = faker.number.int({
      min: MIN_HEIGHT_INCHES,
      max: MAX_HEIGHT_INCHES,
    });
    const heightCm = heightInches * 2.54; // Convert to cm for storage
    const religion = faker.helpers.arrayElement(RELIGIONS);
    const vaccinated = faker.helpers.arrayElement(VACCINATION_STATUS);
    const location = `${city.city}, ${city.state}`;

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

    // Create dating profile
    const profileId = generateIdFromEntropySize(10);
    const profileData: Prisma.user_dating_profileCreateInput = {
      id: profileId,
      user: { connect: { id: userId } },
      age,
      height: heightCm,
      gender,
      sexualOrientation,
      religion,
      coronavirusVaccinated: vaccinated,
      location,
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

    const preferencesData: Prisma.user_dating_preferencesCreateInput = {
      id: preferencesId,
      users: { connect: { id: userId } },
      preferredMinAge,
      preferredMaxAge,
      preferredMaxDistanceKm: faker.helpers.arrayElement([
        25, 50, 100, 150, 200,
      ]),
      preferredMinHeight: Math.max(MIN_HEIGHT_INCHES * 2.54, heightCm - 10),
      preferredMaxHeight: Math.min(MAX_HEIGHT_INCHES * 2.54, heightCm + 15),
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
      preferredInstruments: [], // Can be populated if needed
      preferredSkills: [], // Can be populated if needed
      matchMusicTastes: faker.datatype.boolean(),
    };
    preferencesToCreate.push(preferencesData);

    // Create 1-4 photos per user
    const photoCount = faker.number.int({ min: 1, max: 4 });
    for (let k = 0; k < photoCount; k++) {
      const photoId = generateIdFromEntropySize(10);
      const photoData: Prisma.user_photosCreateInput = {
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

    // Add users to StreamChat
    if (streamClient) {
      const streamChatUsers = usersToCreate.map((user) => ({
        id: user.id!,
        name: user.displayName!,
        image: user.avatarUrl,
        email: user.email!,
      }));
      try {
        await streamClient.upsertUsers(streamChatUsers);
        console.log(
          `...${streamChatUsers.length} users upserted to StreamChat.`,
        );
      } catch (error) {
        console.error(
          `Failed to add users to StreamChat:`,
          (error as Error).message,
        );
      }
    }

    // Create dating profiles
    console.log(`Creating ${profilesToCreate.length} dating profiles...`);
    for (const profile of profilesToCreate) {
      await tx.user_dating_profile.create({
        data: profile,
      });
    }
    console.log(`...${profilesToCreate.length} profiles created.`);

    // Create dating preferences
    console.log(`Creating ${preferencesToCreate.length} dating preferences...`);
    for (const prefs of preferencesToCreate) {
      await tx.user_dating_preferences.create({
        data: prefs,
      });
    }
    console.log(`...${preferencesToCreate.length} preferences created.`);

    // Create photos
    console.log(`Creating ${photosToCreate.length} user photos...`);
    for (const photo of photosToCreate) {
      await tx.user_photos.create({
        data: photo,
      });
    }
    console.log(`...${photosToCreate.length} photos created.`);

    console.log(
      `Dating seeding complete: ${createdDatingUsers.length} users with profiles, preferences, and photos.`,
    );

    return createdDatingUsers;
  } catch (error) {
    console.error("Error during dating profile seeding:", error);
    return [];
  }
}

