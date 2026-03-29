import {
  cypressEnv,
  faker,
  generateIdFromEntropySize
} from "./chunk-TRJORDRN.js";

// prisma/seedModules/datingTeam/datingProfiles.ts
import { NotificationType } from "@prisma/client";

// src/lib/dating/profileOptions.ts
var JOB_OPTIONS = [
  { label: "Artist / Musician", value: "music" },
  { label: "Creative (Design / Media)", value: "creative" },
  { label: "Technology", value: "tech" },
  { label: "Business / Finance", value: "business" },
  { label: "Coaching / Consulting", value: "coaching_consulting" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Education", value: "education" },
  { label: "Hospitality / Service", value: "hospitality" },
  { label: "Trades", value: "trades" },
  { label: "Government", value: "government" },
  { label: "Non-profit", value: "nonprofit" },
  { label: "Sales", value: "sales" },
  { label: "Self-employed", value: "self_employed" },
  { label: "Student", value: "student" },
  { label: "Marketing", value: "marketing" },
  { label: "Unemployed", value: "unemployed" },
  { label: "Other", value: "other" }
];
var PETS_OPTIONS = [
  { label: "No pets", value: "none" },
  { label: "Dog(s)", value: "dogs" },
  { label: "Cat(s)", value: "cats" },
  { label: "Dog(s) & Cat(s)", value: "dogs_and_cats" },
  { label: "Rabbit(s)", value: "rabbits" },
  { label: "Bird(s)", value: "birds" },
  { label: "Fish(es)", value: "fish" },
  { label: "Reptile(s)", value: "reptiles" },
  { label: "Other", value: "other" }
];
var BODY_TYPE_OPTIONS = [
  { label: "Slim", value: "slim" },
  { label: "Athletic", value: "athletic" },
  { label: "Average", value: "average" },
  { label: "Curvy", value: "curvy" },
  { label: "Dad bod", value: "dad_bod" },
  { label: "Mom bod", value: "mom_bod" },
  { label: "Muscular", value: "muscular" },
  { label: "Plus-size", value: "plus_size" },
  { label: "Other", value: "other" }
];

// prisma/seedModules/datingTeam/datingProfiles.ts
var GUARANTEED_TEST_CITIES = [
  { city: "Los Angeles", state: "CA", zip: "90001", lat: 34.0522, lon: -118.2437 },
  { city: "San Francisco", state: "CA", zip: "94102", lat: 37.7749, lon: -122.4194 },
  { city: "Chicago", state: "IL", zip: "60601", lat: 41.8781, lon: -87.6298 },
  { city: "New York", state: "NY", zip: "10001", lat: 40.7128, lon: -74.006 },
  { city: "Austin", state: "TX", zip: "78701", lat: 30.2672, lon: -97.7431 },
  { city: "Honolulu", state: "HI", zip: "96801", lat: 21.3099, lon: -157.8581 }
];
var RANDOM_MAINLAND_CITIES = [
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
  { city: "New Orleans", state: "LA", zip: "70112", lat: 29.9511, lon: -90.0715 }
];
var DATING_USER_COUNT = 200;
var GUARANTEED_USERS_COUNT = 50;
var RANDOM_USERS_COUNT = DATING_USER_COUNT - GUARANTEED_USERS_COUNT;
var GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];
var SEXUAL_ORIENTATIONS = [
  "Straight",
  "Gay",
  "Bisexual",
  "Other"
];
var RELIGIONS = [
  "Christian",
  "Catholic",
  "Jewish",
  "Muslim",
  "Buddhist",
  "Hindu",
  "Sikh",
  "Atheist",
  "Agnostic",
  "Undecided"
];
var VACCINATION_STATUS = ["Yes", "No", ""];
var EDUCATION_LEVELS = ["high_school", "some_college", "bachelors", "masters", "phd", "professional"];
var POLITICAL_VIEWS = ["liberal", "moderate", "conservative", "progressive", "libertarian", "apolitical", "other"];
var DIET_OPTIONS = ["omnivore", "vegetarian", "vegan", "pescatarian", "kosher", "halal", "gluten-free", "keto", "paleo", "other"];
var RELATIONSHIP_TYPES = ["monogamous", "ethical_non_monogamous", "open_to_both"];
var MIN_HEIGHT_INCHES = 36;
var MAX_HEIGHT_INCHES = 94;
var MIN_AGE = 18;
var MAX_AGE = 130;
var SMOKES_OPTIONS = ["Yes", "No", "Social"];
var DRINKS_OPTIONS = ["Yes", "No", "Social"];
var ACTIVITY_OPTIONS = ["Active", "Sporting", "Super active", "Couch potato", "Hiker", "Moderate", "Very active", "Gym enthusiast", "Yoga lover", "Outdoor adventurer", "Weekend warrior"];
var JOB_OPTION_VALUES = JOB_OPTIONS.map((o) => o.value).filter(Boolean);
var PETS_OPTION_VALUES = PETS_OPTIONS.map((o) => o.value).filter(Boolean);
var BODY_TYPE_OPTION_VALUES = BODY_TYPE_OPTIONS.map((o) => o.value).filter(Boolean);
var INTERESTS_OPTIONS = [
  "Gamer",
  "Foodie",
  "Traveler",
  "Photographer",
  "Musician",
  "Artist",
  "Writer",
  "Fitness enthusiast",
  "Yoga",
  "Reading",
  "Movies",
  "Cooking",
  "Dancing",
  "Hiking",
  "Surfing",
  "Cycling",
  "Running",
  "Swimming",
  "Tennis",
  "Basketball",
  "Soccer",
  "Golf",
  "Rock climbing",
  "Skiing",
  "Snowboarding",
  "Camping",
  "Fishing",
  "Gardening",
  "Volunteering",
  "Meditation",
  "Podcasts",
  "Comedy",
  "Theater",
  "Concerts",
  "Festivals",
  "Wine tasting",
  "Coffee",
  "Craft beer",
  "Board games",
  "Video games",
  "Anime",
  "Comics",
  "Fashion",
  "Shopping",
  "Beauty",
  "Makeup",
  "Skincare",
  "Fashion design",
  "Interior design",
  "DIY",
  "Crafts",
  "Knitting",
  "Sewing",
  "Painting",
  "Drawing",
  "Sculpting",
  "Pottery",
  "Woodworking",
  "Cars",
  "Motorcycles",
  "Technology",
  "Coding",
  "Entrepreneurship",
  "Business",
  "Finance",
  "Investing",
  "Real estate",
  "Politics",
  "History",
  "Science",
  "Astronomy",
  "Philosophy",
  "Languages",
  "Learning",
  "Education",
  "Teaching",
  "Pets",
  "Dogs",
  "Cats",
  "Animals",
  "Wildlife",
  "Nature",
  "Environmentalism",
  "Sustainability",
  "Vegan",
  "Vegetarian",
  "Health",
  "Wellness",
  "Nutrition",
  "Fitness",
  "Bodybuilding",
  "CrossFit",
  "Martial arts",
  "Boxing",
  "MMA",
  "Dancing",
  "Ballet",
  "Hip hop",
  "Salsa",
  "Bachata",
  "Ballroom",
  "Latin",
  "Jazz",
  "Blues",
  "Country",
  "Electronic",
  "EDM",
  "House",
  "Techno",
  "Trance",
  "Dubstep",
  "Hip hop music",
  "Rap",
  "R&B",
  "Pop",
  "Rock",
  "Metal",
  "Punk",
  "Indie",
  "Alternative",
  "Folk",
  "Classical",
  "Jazz",
  "Blues",
  "Reggae",
  "World music",
  "K-pop",
  "J-pop",
  "Latin music",
  "Salsa music",
  "Bachata music",
  "Merengue",
  "Cumbia",
  "Reggaeton",
  "Flamenco",
  "Tango",
  "Samba",
  "Bossa nova",
  "Afrobeat",
  "Afrobeats"
];
var MIN_PHOTOS = 1;
var MAX_PHOTOS = 6;
async function deleteDatingTestUsers(tx, streamClient) {
  console.log("Deleting existing dating test users...");
  try {
    const testDomain = cypressEnv.testUserEmailDomain;
    if (!testDomain) {
      console.error(
        "testUserEmailDomain not found in cypress.env.json. Cannot delete by domain."
      );
      return [];
    }
    const datingUsers = await tx.user.findMany({
      where: {
        OR: [
          { username: { startsWith: "dating_user_" } },
          { email: { endsWith: testDomain } }
        ]
      },
      select: { id: true }
    });
    const userIds = datingUsers.map((user) => user.id);
    if (userIds.length === 0) {
      console.log("...No existing dating test users found to delete.");
      if (streamClient) {
        try {
          console.log(`...Skipping StreamChat cleanup (no database users to match with domain ${testDomain}).`);
        } catch (error) {
        }
      }
      return [];
    }
    let streamChatDeletedCount = 0;
    if (streamClient && userIds.length > 0) {
      try {
        const streamUsers = await streamClient.queryUsers({
          id: { $in: userIds }
        });
        if (streamUsers.user.length > 0) {
          console.log(
            `...Found ${streamUsers.user.length} dating users in StreamChat (out of ${userIds.length} database users).`
          );
          if (streamUsers.user.length < userIds.length) {
            console.log(
              `...Note: ${userIds.length - streamUsers.user.length} database users had no StreamChat entries (likely from incomplete previous seed).`
            );
          }
          for (const user of streamUsers.users) {
            try {
              await streamClient.deleteUser(user.id, { hardDelete: true });
              streamChatDeletedCount++;
            } catch (error) {
              console.error(
                `Failed to delete user ${user.id} from StreamChat:`,
                error.message
              );
            }
          }
          console.log(
            `...${streamChatDeletedCount} dating users deleted from StreamChat.`
          );
        } else {
          console.log(
            `...No matching StreamChat users found (${userIds.length} database users had no StreamChat entries - likely from incomplete previous seed).`
          );
        }
      } catch (error) {
        console.error(
          "Error deleting dating users from StreamChat:",
          error.message
        );
      }
    }
    await tx.event.deleteMany({
      where: { createdById: { in: userIds } }
    });
    await tx.post.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.comment.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.like.deleteMany({ where: { userId: { in: userIds } } });
    await tx.dislike.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.bookmark.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.groupMember.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.eventAttendee.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.notification.deleteMany({
      where: {
        OR: [{ recipientId: { in: userIds } }, { issuerId: { in: userIds } }]
      }
    });
    await tx.follow.deleteMany({
      where: {
        OR: [{ followerId: { in: userIds } }, { followingId: { in: userIds } }]
      }
    });
    await tx.report.deleteMany({
      where: {
        OR: [{ reporterId: { in: userIds } }, { reportedId: { in: userIds } }]
      }
    });
    await tx.block.deleteMany({
      where: {
        OR: [{ blockerId: { in: userIds } }, { blockedId: { in: userIds } }]
      }
    });
    await tx.userDatingPhoto.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.userDatingPreferences.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.userDatingProfile.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.swipe.deleteMany({
      where: {
        OR: [
          { fromUserId: { in: userIds } },
          { toUserId: { in: userIds } }
        ]
      }
    });
    await tx.match.deleteMany({
      where: {
        OR: [
          { user1Id: { in: userIds } },
          { user2Id: { in: userIds } }
        ]
      }
    });
    await tx.user.deleteMany({
      where: { id: { in: userIds } }
    });
    console.log(
      `...${userIds.length} dating test users and related data deleted from database.`
    );
    return userIds;
  } catch (error) {
    console.error("Error deleting dating test users:", error);
    return [];
  }
}
async function seedDatingProfiles(tx, streamClient, hasher) {
  if (!tx) {
    console.error("Prisma client is not available for seedDatingProfiles.");
    return [];
  }
  console.log(`Seeding ${DATING_USER_COUNT} dating profiles...`);
  const testDomain = cypressEnv.testUserEmailDomain;
  if (!testDomain) {
    throw new Error(
      "testUserEmailDomain not found in cypress.env.json. Cannot create dating users."
    );
  }
  const hashedPassword = await hasher(cypressEnv.password);
  const createdDatingUsers = [];
  const usersToCreate = [];
  const profilesToCreate = [];
  const preferencesToCreate = [];
  const photosToCreate = [];
  const swipesToCreate = [];
  const matchesToCreate = [];
  const sanitizeUserIdentity = (usernameRaw, displayNameRaw, fallbackNumber) => {
    const username = (usernameRaw || "").trim();
    const displayName = (displayNameRaw || "").trim();
    const safeUsername = username.length > 0 ? username : `dating_user_${fallbackNumber}`;
    const safeDisplayName = displayName.length > 0 ? displayName : safeUsername;
    return { username: safeUsername, displayName: safeDisplayName };
  };
  let userIndex = 0;
  console.log("Creating test users with predefined dating relationships...");
  const testUsers = {};
  const testUserConfigs = [
    {
      username: "testUserDatingDeckReady",
      displayName: "Deck Ready User",
      age: 28,
      gender: "Male",
      sexualOrientation: "Straight",
      location: GUARANTEED_TEST_CITIES[0],
      // Los Angeles
      preferredGender: JSON.stringify([{ gender: "Female", sexualOrientation: ["Straight"] }]),
      preferredSexualOrientation: "Straight",
      preferredMinAge: 23,
      preferredMaxAge: 35
    },
    {
      username: "testUserDatingPendingMatches",
      displayName: "Pending Matches User",
      age: 25,
      gender: "Female",
      sexualOrientation: "Straight",
      location: GUARANTEED_TEST_CITIES[0],
      // Los Angeles
      preferredGender: JSON.stringify([{ gender: "Male", sexualOrientation: ["Straight"] }]),
      preferredSexualOrientation: "Straight",
      preferredMinAge: 23,
      preferredMaxAge: 32
    },
    {
      username: "testUserDatingMutualMatches",
      displayName: "Mutual Matches User",
      age: 30,
      gender: "Male",
      sexualOrientation: "Bisexual",
      location: GUARANTEED_TEST_CITIES[1],
      // San Francisco
      preferredGender: JSON.stringify([
        { gender: "Female", sexualOrientation: ["Straight", "Bisexual"] },
        { gender: "Male", sexualOrientation: ["Gay", "Bisexual"] },
        { gender: "Non-binary", sexualOrientation: [] }
      ]),
      // Open to any - set all genders
      preferredSexualOrientation: null,
      preferredMinAge: 25,
      preferredMaxAge: 40
    },
    {
      username: "testUserDatingNoMatches",
      displayName: "No Matches User",
      age: 22,
      gender: "Female",
      sexualOrientation: "Straight",
      location: GUARANTEED_TEST_CITIES[2],
      // Chicago
      preferredGender: JSON.stringify([{ gender: "Male", sexualOrientation: ["Straight"] }]),
      preferredSexualOrientation: "Straight",
      preferredMinAge: 20,
      preferredMaxAge: 30
    },
    {
      username: "testUserDatingLikedBack",
      displayName: "Liked Back User",
      age: 27,
      gender: "Male",
      sexualOrientation: "Straight",
      location: GUARANTEED_TEST_CITIES[0],
      // Los Angeles
      preferredGender: JSON.stringify([{ gender: "Female", sexualOrientation: ["Straight"] }]),
      preferredSexualOrientation: "Straight",
      preferredMinAge: 22,
      preferredMaxAge: 32
    }
  ];
  const compatibleUsersForDeck = [];
  for (let i = 0; i < 5; i++) {
    compatibleUsersForDeck.push({
      username: `testUserDatingCompatible${i + 1}`,
      config: {
        username: `testUserDatingCompatible${i + 1}`,
        displayName: `Compatible User ${i + 1}`,
        age: 24 + i,
        gender: "Female",
        sexualOrientation: "Straight",
        location: GUARANTEED_TEST_CITIES[0],
        // Same city as DeckReady
        preferredGender: JSON.stringify([{ gender: "Male", sexualOrientation: ["Straight"] }]),
        preferredSexualOrientation: "Straight",
        preferredMinAge: 25,
        preferredMaxAge: 35
      }
    });
  }
  const usersWhoLikedPending = [];
  for (let i = 0; i < 5; i++) {
    usersWhoLikedPending.push({
      username: `testUserDatingLikedPending${i + 1}`,
      config: {
        username: `testUserDatingLikedPending${i + 1}`,
        displayName: `Liked Pending User ${i + 1}`,
        age: 24 + i,
        gender: "Male",
        sexualOrientation: "Straight",
        location: GUARANTEED_TEST_CITIES[0],
        // Same city
        preferredGender: JSON.stringify([{ gender: "Female", sexualOrientation: ["Straight"] }]),
        preferredSexualOrientation: "Straight",
        preferredMinAge: 22,
        preferredMaxAge: 30
      }
    });
  }
  const mutualMatchUsers = [];
  for (let i = 0; i < 3; i++) {
    mutualMatchUsers.push({
      username: `testUserDatingMutualMatch${i + 1}`,
      config: {
        username: `testUserDatingMutualMatch${i + 1}`,
        displayName: `Mutual Match ${i + 1}`,
        age: 28 + i,
        gender: i === 0 ? "Female" : "Male",
        sexualOrientation: i === 0 ? "Straight" : "Bisexual",
        location: GUARANTEED_TEST_CITIES[1],
        // San Francisco
        preferredGender: JSON.stringify([
          { gender: "Female", sexualOrientation: ["Straight", "Bisexual"] },
          { gender: "Male", sexualOrientation: ["Gay", "Bisexual"] },
          { gender: "Non-binary", sexualOrientation: [] }
        ]),
        // Open to any - set all genders
        preferredSexualOrientation: null,
        preferredMinAge: 25,
        preferredMaxAge: 40
      }
    });
  }
  const usersLikedByLikedBack = [];
  for (let i = 0; i < 5; i++) {
    usersLikedByLikedBack.push({
      username: `testUserDatingLikedByLikedBack${i + 1}`,
      config: {
        username: `testUserDatingLikedByLikedBack${i + 1}`,
        displayName: `Liked By LikedBack ${i + 1}`,
        age: 23 + i,
        gender: "Female",
        sexualOrientation: "Straight",
        location: GUARANTEED_TEST_CITIES[0],
        // Los Angeles
        preferredGender: JSON.stringify([{ gender: "Male", sexualOrientation: ["Straight"] }]),
        preferredSexualOrientation: "Straight",
        preferredMinAge: 25,
        preferredMaxAge: 35
      }
    });
  }
  const idVerificationTestUsers = [
    {
      username: "testUserDatingIDVerified1",
      config: {
        username: "testUserDatingIDVerified1",
        displayName: "ID Verified User 1",
        age: 26,
        gender: "Female",
        sexualOrientation: "Straight",
        location: GUARANTEED_TEST_CITIES[0],
        // Los Angeles — same as testUserDatingPendingMatches
        preferredGender: JSON.stringify([{ gender: "Male", sexualOrientation: ["Straight"] }]),
        preferredSexualOrientation: "Straight",
        preferredMinAge: 22,
        preferredMaxAge: 34
      }
    },
    {
      username: "testUserDatingIDVerified2",
      config: {
        username: "testUserDatingIDVerified2",
        displayName: "ID Verified User 2",
        age: 29,
        gender: "Male",
        sexualOrientation: "Straight",
        location: GUARANTEED_TEST_CITIES[0],
        // Los Angeles
        preferredGender: JSON.stringify([{ gender: "Female", sexualOrientation: ["Straight"] }]),
        preferredSexualOrientation: "Straight",
        preferredMinAge: 23,
        preferredMaxAge: 36
      }
    },
    {
      username: "testUserDatingIDUnverified1",
      config: {
        username: "testUserDatingIDUnverified1",
        displayName: "ID Unverified User 1",
        age: 24,
        gender: "Female",
        sexualOrientation: "Straight",
        location: GUARANTEED_TEST_CITIES[0],
        // Los Angeles
        preferredGender: JSON.stringify([{ gender: "Male", sexualOrientation: ["Straight"] }]),
        preferredSexualOrientation: "Straight",
        preferredMinAge: 21,
        preferredMaxAge: 32
      }
    },
    {
      username: "testUserDatingIDUnverified2",
      config: {
        username: "testUserDatingIDUnverified2",
        displayName: "ID Unverified User 2",
        age: 31,
        gender: "Male",
        sexualOrientation: "Bisexual",
        location: GUARANTEED_TEST_CITIES[0],
        // Los Angeles
        preferredGender: JSON.stringify([
          { gender: "Female", sexualOrientation: ["Straight", "Bisexual"] },
          { gender: "Male", sexualOrientation: ["Gay", "Bisexual"] }
        ]),
        preferredSexualOrientation: null,
        preferredMinAge: 24,
        preferredMaxAge: 38
      }
    }
  ];
  const allTestUsers = [
    ...testUserConfigs.map((c) => ({ username: c.username, config: c })),
    ...compatibleUsersForDeck,
    ...usersWhoLikedPending,
    ...mutualMatchUsers,
    ...usersLikedByLikedBack,
    ...idVerificationTestUsers
  ];
  for (const { username, config } of allTestUsers) {
    const userId = generateIdFromEntropySize(10);
    const identity = sanitizeUserIdentity(username, config.displayName, userIndex + 1);
    const email = `${identity.username}${testDomain}`;
    const heightInches = 66;
    const locationZip = config.location.zip || "90001";
    const locationCity = config.location.city || "Los Angeles";
    const locationLat = config.location.lat || 34.0522;
    const locationLon = config.location.lon || -118.2437;
    const userData = {
      id: userId,
      username: identity.username,
      email,
      displayName: identity.displayName,
      passwordHash: hashedPassword,
      isEmailVerified: true,
      isDatingActive: true,
      avatarUrl: `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`,
      bio: `Test user: ${config.displayName}`,
      createdAt: faker.date.between({
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1e3),
        to: /* @__PURE__ */ new Date()
      })
    };
    usersToCreate.push(userData);
    const profileId = generateIdFromEntropySize(10);
    const profileData = {
      id: profileId,
      user: { connect: { id: userId } },
      age: config.age,
      height: heightInches,
      // Store as inches (Int)
      gender: config.gender,
      sexualOrientation: config.sexualOrientation,
      religion: "Atheist",
      bodyType: null,
      coronavirusVaccinated: "Yes",
      zipCode: locationZip,
      // Store zip code
      city: locationCity,
      // Store city name (geocoded)
      latitude: locationLat,
      longitude: locationLon
    };
    profilesToCreate.push(profileData);
    const preferencesId = generateIdFromEntropySize(10);
    const preferencesData = {
      id: preferencesId,
      user: { connect: { id: userId } },
      preferredMinAge: config.preferredMinAge,
      preferredMaxAge: config.preferredMaxAge,
      preferredMaxDistanceKm: 50,
      // 50km for test users
      preferredMinHeight: 60,
      // 5'0" in inches
      preferredMaxHeight: 72,
      // 6'0" in inches
      preferredGender: config.preferredGender,
      // Already JSON string from config
      preferredSexualOrientation: config.preferredSexualOrientation,
      preferredCoronavirusVaccinated: null,
      preferredReligions: [],
      preferredBodyType: null,
      preferredHasKids: null,
      preferredWantsKids: null,
      preferredEducation: [],
      preferredPoliticalViews: [],
      preferredDiet: [],
      preferredRelationshipType: [],
      preferredPets: [],
      preferredInstruments: [],
      preferredSkills: [],
      matchMusicTastes: false,
      variabilityLevel: 0,
      variabilityFilters: [],
      idVerificationFilter: "show_id_verified_only"
    };
    preferencesToCreate.push(preferencesData);
    for (let j = 0; j < 2; j++) {
      const photoId = generateIdFromEntropySize(10);
      const photoData = {
        id: photoId,
        user: { connect: { id: userId } },
        url: `https://i.pravatar.cc/400?img=${faker.number.int({ min: 1, max: 70 })}`,
        isPrimary: j === 0
      };
      photosToCreate.push(photoData);
    }
    testUsers[username] = { id: userId, userId, username };
    createdDatingUsers.push({
      id: userId,
      userId,
      username,
      isDatingActive: true
    });
  }
  const pendingMatchesUserId = testUsers["testUserDatingPendingMatches"]?.id;
  if (pendingMatchesUserId) {
    for (let i = 0; i < 5; i++) {
      const likerUsername = `testUserDatingLikedPending${i + 1}`;
      const likerId = testUsers[likerUsername]?.id;
      if (likerId) {
        swipesToCreate.push({
          fromUserId: likerId,
          toUserId: pendingMatchesUserId,
          direction: "LIKE"
        });
      }
    }
    for (const idTestUser of idVerificationTestUsers) {
      const likerId = testUsers[idTestUser.username]?.id;
      if (likerId) {
        swipesToCreate.push({
          fromUserId: likerId,
          toUserId: pendingMatchesUserId,
          direction: "LIKE"
        });
      }
    }
  }
  const mutualMatchesUserId = testUsers["testUserDatingMutualMatches"]?.id;
  if (mutualMatchesUserId) {
    for (let i = 0; i < 3; i++) {
      const matchUsername = `testUserDatingMutualMatch${i + 1}`;
      const matchId = testUsers[matchUsername]?.id;
      if (matchId) {
        swipesToCreate.push({
          fromUserId: mutualMatchesUserId,
          toUserId: matchId,
          direction: "LIKE"
        });
        swipesToCreate.push({
          fromUserId: matchId,
          toUserId: mutualMatchesUserId,
          direction: "LIKE"
        });
        matchesToCreate.push({
          user1Id: mutualMatchesUserId < matchId ? mutualMatchesUserId : matchId,
          user2Id: mutualMatchesUserId < matchId ? matchId : mutualMatchesUserId
        });
      }
    }
  }
  const likedBackUserId = testUsers["testUserDatingLikedBack"]?.id;
  if (likedBackUserId) {
    for (let i = 0; i < 5; i++) {
      const likedUsername = `testUserDatingLikedByLikedBack${i + 1}`;
      const likedId = testUsers[likedUsername]?.id;
      if (likedId) {
        swipesToCreate.push({
          fromUserId: likedBackUserId,
          toUserId: likedId,
          direction: "LIKE"
        });
      }
    }
  }
  console.log(`...Created ${allTestUsers.length} test users with predefined relationships.`);
  const usersPerGuaranteedCity = Math.floor(
    GUARANTEED_USERS_COUNT / GUARANTEED_TEST_CITIES.length
  );
  const remainderGuaranteed = GUARANTEED_USERS_COUNT % GUARANTEED_TEST_CITIES.length;
  for (let cityIdx = 0; cityIdx < GUARANTEED_TEST_CITIES.length; cityIdx++) {
    const city = GUARANTEED_TEST_CITIES[cityIdx];
    const usersForThisCity = usersPerGuaranteedCity + (cityIdx < remainderGuaranteed ? 1 : 0);
    for (let j = 0; j < usersForThisCity; j++) {
      const userId = generateIdFromEntropySize(10);
      const identity = sanitizeUserIdentity(
        `dating_user_${userIndex + 1}`,
        faker.person.fullName(),
        userIndex + 1
      );
      const username = identity.username;
      const email = `${identity.username}${testDomain}`;
      userIndex++;
      const age = faker.number.int({ min: MIN_AGE, max: MAX_AGE });
      const gender = faker.helpers.arrayElement(GENDERS);
      const sexualOrientation = faker.helpers.arrayElement(SEXUAL_ORIENTATIONS);
      const heightInches = faker.number.int({
        min: MIN_HEIGHT_INCHES,
        max: MAX_HEIGHT_INCHES
      });
      const religion = faker.helpers.arrayElement(RELIGIONS);
      const vaccinated = faker.helpers.arrayElement(VACCINATION_STATUS);
      const locationZip = city.zip || "90001";
      const locationCity = city.city;
      const locationLat = city.lat;
      const locationLon = city.lon;
      const userData = {
        id: userId,
        username,
        email,
        displayName: identity.displayName,
        passwordHash: hashedPassword,
        isEmailVerified: true,
        isDatingActive: true,
        avatarUrl: `https://i.pravatar.cc/150?img=${faker.number.int({
          min: 1,
          max: 70
        })}`,
        bio: faker.lorem.sentence(),
        createdAt: faker.date.between({
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1e3),
          to: /* @__PURE__ */ new Date()
        })
      };
      usersToCreate.push(userData);
      const profileCompleteness = faker.number.float({ min: 0.3, max: 1 });
      const profileId = generateIdFromEntropySize(10);
      const hasKids = faker.datatype.boolean({ probability: profileCompleteness * 0.7 }) ? faker.datatype.boolean() : null;
      const profileData = {
        id: profileId,
        user: { connect: { id: userId } },
        age,
        height: heightInches,
        // Store as inches (Int)
        gender,
        sexualOrientation,
        religion,
        coronavirusVaccinated: vaccinated,
        zipCode: locationZip,
        // Store zip code
        city: locationCity,
        // Store city name (geocoded)
        latitude: locationLat,
        longitude: locationLon,
        // Randomly populate optional fields based on completeness
        bio: faker.datatype.boolean({ probability: profileCompleteness * 0.8 }) ? faker.lorem.paragraph({ min: 1, max: 3 }) : null,
        hasKids,
        smokes: faker.datatype.boolean({ probability: profileCompleteness * 0.9 }) ? faker.helpers.arrayElement(SMOKES_OPTIONS) : null,
        drinks: faker.datatype.boolean({ probability: profileCompleteness * 0.9 }) ? faker.helpers.arrayElement(DRINKS_OPTIONS) : null,
        activity: faker.datatype.boolean({ probability: profileCompleteness * 0.8 }) ? faker.helpers.arrayElement(ACTIVITY_OPTIONS) : null,
        education: faker.datatype.boolean({ probability: profileCompleteness * 0.7 }) ? faker.helpers.arrayElement(EDUCATION_LEVELS) : null,
        wantsKids: faker.datatype.boolean({ probability: profileCompleteness * 0.6 }) ? faker.helpers.arrayElement(["yes", "no", "maybe", "not_sure"]) : null,
        politicalViews: faker.datatype.boolean({ probability: profileCompleteness * 0.5 }) ? faker.helpers.arrayElement(POLITICAL_VIEWS) : null,
        diet: faker.datatype.boolean({ probability: profileCompleteness * 0.4 }) ? faker.helpers.arrayElement(DIET_OPTIONS) : null,
        relationshipType: faker.datatype.boolean({ probability: profileCompleteness * 0.5 }) ? faker.helpers.arrayElement(RELATIONSHIP_TYPES) : null,
        bodyType: faker.datatype.boolean({ probability: profileCompleteness * 0.5 }) ? faker.helpers.arrayElement(BODY_TYPE_OPTION_VALUES) : null,
        job: faker.datatype.boolean({ probability: profileCompleteness * 0.75 }) ? faker.helpers.arrayElement(JOB_OPTION_VALUES) : null,
        pets: faker.datatype.boolean({ probability: profileCompleteness * 0.6 }) ? faker.helpers.arrayElements(PETS_OPTION_VALUES, { min: 1, max: 2 }) : [],
        interests: faker.datatype.boolean({ probability: profileCompleteness * 0.85 }) ? faker.helpers.arrayElements(INTERESTS_OPTIONS, { min: 1, max: Math.min(8, Math.floor(profileCompleteness * 10)) }) : []
      };
      profilesToCreate.push(profileData);
      const preferencesId = generateIdFromEntropySize(10);
      const preferredMinAge = Math.max(MIN_AGE, age - 5);
      const preferredMaxAge = Math.min(MAX_AGE, age + 10);
      const preferredGender = gender === "Non-binary" ? null : faker.helpers.arrayElement([
        gender,
        null,
        faker.helpers.arrayElement(GENDERS)
      ]);
      const preferredSexualOrientation = faker.helpers.arrayElement([
        sexualOrientation,
        null,
        faker.helpers.arrayElement(SEXUAL_ORIENTATIONS)
      ]);
      const preferencesData = {
        id: preferencesId,
        user: { connect: { id: userId } },
        preferredMinAge,
        preferredMaxAge,
        preferredMaxDistanceKm: faker.helpers.arrayElement([
          25,
          50,
          100,
          150,
          200
        ]),
        preferredMinHeight: Math.max(MIN_HEIGHT_INCHES, heightInches - 10),
        preferredMaxHeight: Math.min(MAX_HEIGHT_INCHES, heightInches + 15),
        preferredGender,
        preferredSexualOrientation,
        preferredCoronavirusVaccinated: faker.helpers.arrayElement([
          vaccinated,
          null,
          faker.helpers.arrayElement(VACCINATION_STATUS)
        ]),
        preferredReligions: faker.helpers.arrayElements(RELIGIONS, {
          min: 0,
          max: 3
        }),
        preferredBodyType: faker.datatype.boolean({ probability: 0.4 }) ? faker.helpers.arrayElement(BODY_TYPE_OPTION_VALUES) : null,
        preferredHasKids: faker.helpers.arrayElement([
          hasKids !== null ? hasKids ? "yes" : "no" : null,
          null,
          faker.helpers.arrayElement(["yes", "no", "any", ""])
        ]),
        preferredWantsKids: faker.datatype.boolean({ probability: 0.6 }) ? faker.helpers.arrayElement(["yes", "no", "maybe", "any"]) : null,
        preferredEducation: faker.datatype.boolean({ probability: 0.5 }) ? faker.helpers.arrayElements(EDUCATION_LEVELS, { min: 1, max: 3 }) : [],
        preferredPoliticalViews: faker.datatype.boolean({ probability: 0.4 }) ? faker.helpers.arrayElements(POLITICAL_VIEWS, { min: 1, max: 3 }) : [],
        preferredDiet: faker.datatype.boolean({ probability: 0.3 }) ? faker.helpers.arrayElements(DIET_OPTIONS, { min: 1, max: 2 }) : [],
        preferredRelationshipType: faker.datatype.boolean({ probability: 0.4 }) ? faker.helpers.arrayElements(RELATIONSHIP_TYPES, { min: 1, max: 2 }) : [],
        preferredActivity: faker.datatype.boolean({ probability: 0.5 }) ? faker.helpers.arrayElements(ACTIVITY_OPTIONS, { min: 1, max: 3 }) : [],
        preferredInstruments: [],
        preferredSkills: [],
        matchMusicTastes: faker.datatype.boolean(),
        variabilityLevel: faker.datatype.boolean({ probability: 0.2 }) ? 0 : faker.number.int({ min: 10, max: 50 }),
        // Others have 10-50% variability
        variabilityFilters: faker.datatype.boolean({ probability: 0.3 }) ? faker.helpers.arrayElements([
          "gender",
          "age",
          "distance",
          "height",
          "hasKids",
          "wantsKids",
          "smokes",
          "drinks",
          "vaccination",
          "relationshipType",
          "activity",
          "diet",
          "politicalViews",
          "education",
          "religion",
          "bodyType",
          "pets"
        ], { min: 1, max: 5 }) : [],
        // Default to safest setting — users can change in the app
        idVerificationFilter: "show_id_verified_only"
      };
      preferencesToCreate.push(preferencesData);
      const photoCount = faker.number.int({ min: MIN_PHOTOS, max: MAX_PHOTOS });
      for (let k = 0; k < photoCount; k++) {
        const photoId = generateIdFromEntropySize(10);
        const photoData = {
          id: photoId,
          user: { connect: { id: userId } },
          url: `https://i.pravatar.cc/400?img=${faker.number.int({
            min: 1,
            max: 70
          })}`,
          isPrimary: k === 0
        };
        photosToCreate.push(photoData);
      }
      createdDatingUsers.push({
        id: userId,
        userId,
        username,
        isDatingActive: true
      });
    }
  }
  for (let i = 0; i < RANDOM_USERS_COUNT; i++) {
    const userId = generateIdFromEntropySize(10);
    const city = faker.helpers.arrayElement(RANDOM_MAINLAND_CITIES);
    const identity = sanitizeUserIdentity(
      `dating_user_${userIndex + 1}`,
      faker.person.fullName(),
      userIndex + 1
    );
    const username = identity.username;
    const email = `${identity.username}${testDomain}`;
    userIndex++;
    const age = faker.number.int({ min: MIN_AGE, max: MAX_AGE });
    const gender = faker.helpers.arrayElement(GENDERS);
    const sexualOrientation = faker.helpers.arrayElement(SEXUAL_ORIENTATIONS);
    const heightInches = faker.number.int({
      min: MIN_HEIGHT_INCHES,
      max: MAX_HEIGHT_INCHES
    });
    const religion = faker.helpers.arrayElement(RELIGIONS);
    const vaccinated = faker.helpers.arrayElement(VACCINATION_STATUS);
    const locationZip = city.zip || "90001";
    const locationCity = city.city;
    const locationLat = city.lat;
    const locationLon = city.lon;
    const userData = {
      id: userId,
      username,
      email,
      displayName: identity.displayName,
      passwordHash: hashedPassword,
      isEmailVerified: true,
      isDatingActive: true,
      // Enable dating feature
      avatarUrl: `https://i.pravatar.cc/150?img=${faker.number.int({
        min: 1,
        max: 70
      })}`,
      bio: faker.lorem.sentence(),
      createdAt: faker.date.between({
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1e3),
        to: /* @__PURE__ */ new Date()
      })
    };
    usersToCreate.push(userData);
    const profileCompleteness = faker.number.float({ min: 0.3, max: 1 });
    const profileId = generateIdFromEntropySize(10);
    const hasKids = faker.datatype.boolean({ probability: profileCompleteness * 0.7 }) ? faker.datatype.boolean() : null;
    const profileData = {
      id: profileId,
      user: { connect: { id: userId } },
      age,
      height: heightInches,
      // Store as inches (Int)
      gender,
      sexualOrientation,
      religion,
      coronavirusVaccinated: vaccinated,
      zipCode: locationZip,
      // Store zip code
      city: locationCity,
      // Store city name (geocoded)
      latitude: locationLat,
      longitude: locationLon,
      // Randomly populate optional fields based on completeness
      bio: faker.datatype.boolean({ probability: profileCompleteness * 0.8 }) ? faker.lorem.paragraph({ min: 1, max: 3 }) : null,
      hasKids,
      smokes: faker.datatype.boolean({ probability: profileCompleteness * 0.9 }) ? faker.helpers.arrayElement(SMOKES_OPTIONS) : null,
      drinks: faker.datatype.boolean({ probability: profileCompleteness * 0.9 }) ? faker.helpers.arrayElement(DRINKS_OPTIONS) : null,
      activity: faker.datatype.boolean({ probability: profileCompleteness * 0.8 }) ? faker.helpers.arrayElement(ACTIVITY_OPTIONS) : null,
      education: faker.datatype.boolean({ probability: profileCompleteness * 0.7 }) ? faker.helpers.arrayElement(EDUCATION_LEVELS) : null,
      wantsKids: faker.datatype.boolean({ probability: profileCompleteness * 0.6 }) ? faker.helpers.arrayElement(["yes", "no", "maybe", "not_sure"]) : null,
      politicalViews: faker.datatype.boolean({ probability: profileCompleteness * 0.5 }) ? faker.helpers.arrayElement(POLITICAL_VIEWS) : null,
      diet: faker.datatype.boolean({ probability: profileCompleteness * 0.4 }) ? faker.helpers.arrayElement(DIET_OPTIONS) : null,
      relationshipType: faker.datatype.boolean({ probability: profileCompleteness * 0.5 }) ? faker.helpers.arrayElement(RELATIONSHIP_TYPES) : null,
      job: faker.datatype.boolean({ probability: profileCompleteness * 0.75 }) ? faker.helpers.arrayElement(JOB_OPTION_VALUES) : null,
      bodyType: faker.datatype.boolean({ probability: profileCompleteness * 0.5 }) ? faker.helpers.arrayElement(BODY_TYPE_OPTION_VALUES) : null,
      pets: faker.datatype.boolean({ probability: profileCompleteness * 0.6 }) ? faker.helpers.arrayElements(PETS_OPTION_VALUES, { min: 1, max: 2 }) : [],
      interests: faker.datatype.boolean({ probability: profileCompleteness * 0.85 }) ? faker.helpers.arrayElements(INTERESTS_OPTIONS, { min: 1, max: Math.min(8, Math.floor(profileCompleteness * 10)) }) : []
    };
    profilesToCreate.push(profileData);
    const preferencesId = generateIdFromEntropySize(10);
    const preferredMinAge = Math.max(MIN_AGE, age - 5);
    const preferredMaxAge = Math.min(MAX_AGE, age + 10);
    const preferredGender = gender === "Non-binary" ? null : faker.helpers.arrayElement([
      gender,
      null,
      faker.helpers.arrayElement(GENDERS)
    ]);
    const preferredSexualOrientation = faker.helpers.arrayElement([
      sexualOrientation,
      null,
      faker.helpers.arrayElement(SEXUAL_ORIENTATIONS)
    ]);
    const preferencesData = {
      id: preferencesId,
      user: { connect: { id: userId } },
      preferredMinAge,
      preferredMaxAge,
      preferredMaxDistanceKm: faker.helpers.arrayElement([
        25,
        50,
        100,
        150,
        200
      ]),
      preferredMinHeight: Math.max(MIN_HEIGHT_INCHES, heightInches - 10),
      preferredMaxHeight: Math.min(MAX_HEIGHT_INCHES, heightInches + 15),
      preferredGender,
      preferredSexualOrientation,
      preferredCoronavirusVaccinated: faker.helpers.arrayElement([
        vaccinated,
        null,
        faker.helpers.arrayElement(VACCINATION_STATUS)
      ]),
      preferredReligions: faker.helpers.arrayElements(RELIGIONS, {
        min: 0,
        max: 3
      }),
      preferredBodyType: faker.datatype.boolean({ probability: 0.4 }) ? faker.helpers.arrayElement(BODY_TYPE_OPTION_VALUES) : null,
      preferredHasKids: faker.helpers.arrayElement([
        hasKids !== null ? hasKids ? "Yes" : "No" : null,
        null,
        faker.helpers.arrayElement(["Yes", "No", ""])
      ]),
      preferredWantsKids: faker.datatype.boolean({ probability: 0.6 }) ? faker.helpers.arrayElement(["yes", "no", "maybe", "any"]) : null,
      preferredEducation: faker.datatype.boolean({ probability: 0.5 }) ? faker.helpers.arrayElements(EDUCATION_LEVELS, { min: 1, max: 3 }) : [],
      preferredPoliticalViews: faker.datatype.boolean({ probability: 0.4 }) ? faker.helpers.arrayElements(POLITICAL_VIEWS, { min: 1, max: 3 }) : [],
      preferredDiet: faker.datatype.boolean({ probability: 0.3 }) ? faker.helpers.arrayElements(DIET_OPTIONS, { min: 1, max: 2 }) : [],
      preferredRelationshipType: faker.datatype.boolean({ probability: 0.4 }) ? faker.helpers.arrayElements(RELATIONSHIP_TYPES, { min: 1, max: 2 }) : [],
      preferredActivity: faker.datatype.boolean({ probability: 0.5 }) ? faker.helpers.arrayElements(ACTIVITY_OPTIONS, { min: 1, max: 3 }) : [],
      preferredInstruments: [],
      // Can be populated if needed
      preferredSkills: [],
      // Can be populated if needed
      matchMusicTastes: faker.datatype.boolean(),
      variabilityLevel: faker.datatype.boolean({ probability: 0.2 }) ? 0 : faker.number.int({ min: 10, max: 50 }),
      // Others have 10-50% variability
      variabilityFilters: faker.datatype.boolean({ probability: 0.3 }) ? faker.helpers.arrayElements([
        "gender",
        "age",
        "distance",
        "height",
        "hasKids",
        "wantsKids",
        "smokes",
        "drinks",
        "vaccination",
        "relationshipType",
        "activity",
        "diet",
        "politicalViews",
        "education",
        "religion",
        "bodyType",
        "pets"
      ], { min: 1, max: 5 }) : [],
      // Default to safest setting — users can change in the app
      idVerificationFilter: "show_id_verified_only"
    };
    preferencesToCreate.push(preferencesData);
    const photoCount = faker.number.int({ min: 1, max: 4 });
    for (let k = 0; k < photoCount; k++) {
      const photoId = generateIdFromEntropySize(10);
      const photoData = {
        id: photoId,
        user: { connect: { id: userId } },
        url: `https://i.pravatar.cc/400?img=${faker.number.int({
          min: 1,
          max: 70
        })}`,
        isPrimary: k === 0
      };
      photosToCreate.push(photoData);
    }
    createdDatingUsers.push({
      id: userId,
      userId,
      username,
      isDatingActive: true
    });
  }
  try {
    console.log(`Creating ${usersToCreate.length} dating users...`);
    await tx.user.createMany({
      data: usersToCreate,
      skipDuplicates: true
    });
    console.log(`...${usersToCreate.length} users created.`);
    const usernamesToCreate = usersToCreate.map((u) => u.username);
    const actualCreatedUsers = await tx.user.findMany({
      where: {
        username: { in: usernamesToCreate }
      },
      select: { id: true, username: true }
    });
    const userIdMap = /* @__PURE__ */ new Map();
    for (const attemptedUser of usersToCreate) {
      const actualUser = actualCreatedUsers.find((u) => u.username === attemptedUser.username);
      if (actualUser) {
        userIdMap.set(attemptedUser.id, actualUser.id);
      }
    }
    const createdUserIds = new Set(actualCreatedUsers.map((u) => u.id));
    console.log(`...Fetched ${actualCreatedUsers.length} actual users from DB.`);
    const validProfiles = profilesToCreate.map((p) => {
      const attemptedUserId = p.user.connect.id;
      const actualUserId = userIdMap.get(attemptedUserId);
      if (!actualUserId) return null;
      return { ...p, actualUserId };
    }).filter((p) => p !== null);
    const validPreferences = preferencesToCreate.map((p) => {
      const attemptedUserId = p.user.connect.id;
      const actualUserId = userIdMap.get(attemptedUserId);
      if (!actualUserId) return null;
      return { ...p, actualUserId };
    }).filter((p) => p !== null);
    const validPhotos = photosToCreate.map((p) => {
      const attemptedUserId = p.user.connect.id;
      const actualUserId = userIdMap.get(attemptedUserId);
      if (!actualUserId) return null;
      return { ...p, actualUserId };
    }).filter((p) => p !== null);
    if (validProfiles.length < profilesToCreate.length) {
      console.log(
        `...Filtered out ${profilesToCreate.length - validProfiles.length} profiles for users that weren't created (duplicates).`
      );
    }
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
        interests: p.interests || []
      };
    });
    const profileBatchSize = 50;
    for (let i = 0; i < profilesData.length; i += profileBatchSize) {
      const batch = profilesData.slice(i, i + profileBatchSize);
      await tx.userDatingProfile.createMany({
        data: batch,
        skipDuplicates: true
      });
    }
    console.log(`...${validProfiles.length} profiles created.`);
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
        variabilityLevel: p.variabilityLevel ?? 0,
        variabilityFilters: p.variabilityFilters || [],
        idVerificationFilter: p.idVerificationFilter || "show_id_verified_only"
      };
    });
    const preferencesBatchSize = 50;
    for (let i = 0; i < preferencesData.length; i += preferencesBatchSize) {
      const batch = preferencesData.slice(i, i + preferencesBatchSize);
      await tx.userDatingPreferences.createMany({
        data: batch,
        skipDuplicates: true
      });
    }
    console.log(`...${validPreferences.length} preferences created.`);
    console.log(`Creating ${validPhotos.length} user photos...`);
    const photosData = validPhotos.map((p) => {
      const userId = p.actualUserId;
      return {
        id: p.id,
        userId,
        url: p.url,
        isPrimary: p.isPrimary
      };
    });
    const photosBatchSize = 100;
    for (let i = 0; i < photosData.length; i += photosBatchSize) {
      const batch = photosData.slice(i, i + photosBatchSize);
      await tx.userDatingPhoto.createMany({
        data: batch,
        skipDuplicates: true
      });
    }
    console.log(`...${validPhotos.length} photos created.`);
    if (swipesToCreate.length > 0) {
      console.log(`Creating ${swipesToCreate.length} swipes for test users...`);
      let swipeCount = 0;
      for (const swipe of swipesToCreate) {
        const actualFromUserId = userIdMap.get(swipe.fromUserId) || swipe.fromUserId;
        const actualToUserId = userIdMap.get(swipe.toUserId) || swipe.toUserId;
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
              createdAt: /* @__PURE__ */ new Date()
            }
          });
          swipeCount++;
        } catch (error) {
          console.warn(`Swipe already exists or error: ${error.message}`);
        }
      }
      console.log(`...${swipeCount} swipes created.`);
    }
    if (matchesToCreate.length > 0) {
      console.log(`Creating ${matchesToCreate.length} matches for test users...`);
      const createdMatches = [];
      let matchCount = 0;
      for (const match of matchesToCreate) {
        const actualUser1Id = userIdMap.get(match.user1Id) || match.user1Id;
        const actualUser2Id = userIdMap.get(match.user2Id) || match.user2Id;
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
              createdAt: /* @__PURE__ */ new Date()
            }
          });
          createdMatches.push({
            matchId,
            user1Id: actualUser1Id,
            user2Id: actualUser2Id
          });
          matchCount++;
        } catch (error) {
          console.warn(`Match already exists or error: ${error.message}`);
        }
      }
      console.log(`...${matchCount} matches created.`);
      if (createdMatches.length > 0) {
        console.log(`Creating ${createdMatches.length * 2} match notifications...`);
        const notificationsToCreate = [];
        for (const match of createdMatches) {
          notificationsToCreate.push({
            id: generateIdFromEntropySize(10),
            recipientId: match.user1Id,
            issuerId: match.user2Id,
            type: NotificationType.MATCH,
            matchId: match.matchId,
            read: false,
            createdAt: /* @__PURE__ */ new Date()
          });
          notificationsToCreate.push({
            id: generateIdFromEntropySize(10),
            recipientId: match.user2Id,
            issuerId: match.user1Id,
            type: NotificationType.MATCH,
            matchId: match.matchId,
            read: false,
            createdAt: /* @__PURE__ */ new Date()
          });
        }
        if (notificationsToCreate.length > 0) {
          try {
            await tx.notification.createMany({
              data: notificationsToCreate,
              skipDuplicates: true
            });
            console.log(`...${notificationsToCreate.length} match notifications created.`);
          } catch (error) {
            console.warn(`Error creating match notifications: ${error.message}`);
          }
        }
      }
    }
    console.log(
      `Dating seeding complete: ${createdDatingUsers.length} users with profiles, preferences, photos, swipes, and matches.`
    );
    console.log("\nTest Users Created:");
    console.log("  - testUserDatingDeckReady: Has 5 compatible users ready in deck");
    console.log("  - testUserDatingPendingMatches: Has 5 users who liked them (pending matches) + 4 ID verification test likers");
    console.log("  - testUserDatingMutualMatches: Has 3 mutual matches");
    console.log("  - testUserDatingNoMatches: Fresh user with no activity");
    console.log("  - testUserDatingLikedBack: Liked 5 users, waiting for responses");
    console.log("\nID Verification Test Users (explicit records set in identityVerification.ts):");
    console.log("  - testUserDatingIDVerified1: Female, LA, isIDVerified=TRUE \u2014 will appear in 'ID Verified' filter");
    console.log("  - testUserDatingIDVerified2: Male, LA, isIDVerified=TRUE \u2014 will appear in 'ID Verified' filter");
    console.log("  - testUserDatingIDUnverified1: Female, LA, isIDVerified=FALSE \u2014 only appears in 'Show All' or 'Unverified' filter");
    console.log("  - testUserDatingIDUnverified2: Male, LA, isIDVerified=FALSE \u2014 only appears in 'Show All' or 'Unverified' filter");
    console.log("  All 4 have liked testUserDatingPendingMatches \u2014 use that account to test the 'Who Likes You' filter.");
    return createdDatingUsers;
  } catch (error) {
    console.error("Error during dating profile seeding:", error);
    return [];
  }
}

// prisma/seedDatingOnly.ts
var {
  prisma,
  streamChatClient: streamChatClient2,
  passwordHash: passwordHash2
} = await import("./seedUtils-3VTZJKVD.js");
async function main() {
  console.log("Running dating seed only...");
  console.log("Initiating deletion phase...");
  try {
    const deletedUserIds = await deleteDatingTestUsers(prisma, streamChatClient2);
    console.log("Deletion phase completed.");
  } catch (error) {
    console.error("Error during deletion phase (continuing anyway):", error);
  }
  console.log("Start seeding...");
  try {
    await prisma.$transaction(
      async (tx) => {
        console.log("Starting Prisma transaction for dating seed...");
        await seedDatingProfiles(tx, streamChatClient2, passwordHash2);
        console.log("Dating seed transaction committed successfully.");
      },
      {
        timeout: 3e5
        // 5 minutes timeout for dating seed (200+ users with photos)
      }
    );
    console.log("Dating seeding finished successfully.");
  } catch (error) {
    console.error("Error during dating seed:", error);
    throw error;
  }
}
main().catch((e) => {
  console.error("Dating seed script failed:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
  console.log("Prisma client disconnected.");
});
