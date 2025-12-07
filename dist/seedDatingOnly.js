import {
  cypressEnv,
  faker,
  generateIdFromEntropySize
} from "./chunk-6LT2VYDU.js";

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
var MIN_HEIGHT_INCHES = 36;
var MAX_HEIGHT_INCHES = 94;
var MIN_AGE = 18;
var MAX_AGE = 130;
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
        if (streamUsers.users.length > 0) {
          console.log(
            `...Found ${streamUsers.users.length} dating users in StreamChat (out of ${userIds.length} database users).`
          );
          if (streamUsers.users.length < userIds.length) {
            console.log(
              `...Note: ${userIds.length - streamUsers.users.length} database users had no StreamChat entries (likely from incomplete previous seed).`
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
    await tx.user_photos.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.user_dating_preferences.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.user_dating_profile.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.dating_location_overrides.deleteMany({
      where: { userId: { in: userIds } }
    });
    await tx.swipes.deleteMany({
      where: {
        OR: [
          { fromUserId: { in: userIds } },
          { toUserId: { in: userIds } }
        ]
      }
    });
    await tx.matches.deleteMany({
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
      preferredGender: "Female",
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
      preferredGender: "Male",
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
      preferredGender: null,
      // Open to any
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
      preferredGender: "Male",
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
      preferredGender: "Female",
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
        preferredGender: "Male",
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
        preferredGender: "Female",
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
        preferredGender: null,
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
        preferredGender: "Male",
        preferredSexualOrientation: "Straight",
        preferredMinAge: 25,
        preferredMaxAge: 35
      }
    });
  }
  const allTestUsers = [
    ...testUserConfigs.map((c) => ({ username: c.username, config: c })),
    ...compatibleUsersForDeck,
    ...usersWhoLikedPending,
    ...mutualMatchUsers,
    ...usersLikedByLikedBack
  ];
  for (const { username, config } of allTestUsers) {
    const userId = generateIdFromEntropySize(10);
    const email = `${username}${testDomain}`;
    const heightInches = 66;
    const locationZip = config.location.zip || "90001";
    const locationCity = config.location.city || "Los Angeles";
    const locationLat = config.location.lat || 34.0522;
    const locationLon = config.location.lon || -118.2437;
    const userData = {
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
      users: { connect: { id: userId } },
      preferredMinAge: config.preferredMinAge,
      preferredMaxAge: config.preferredMaxAge,
      preferredMaxDistanceKm: 50,
      // 50km for test users
      preferredMinHeight: 60,
      // 5'0" in inches
      preferredMaxHeight: 72,
      // 6'0" in inches
      preferredGender: config.preferredGender,
      preferredSexualOrientation: config.preferredSexualOrientation,
      preferredCoronavirusVaccinated: null,
      preferredReligions: [],
      preferredInstruments: [],
      preferredSkills: [],
      matchMusicTastes: false
    };
    preferencesToCreate.push(preferencesData);
    for (let j = 0; j < 2; j++) {
      const photoId = generateIdFromEntropySize(10);
      const photoData = {
        id: photoId,
        users: { connect: { id: userId } },
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
      const username = `dating_user_${userIndex + 1}`;
      const email = `dating_user_${userIndex + 1}${testDomain}`;
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
        displayName: faker.person.fullName(),
        passwordHash: hashedPassword,
        isVerified: true,
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
      const profileId = generateIdFromEntropySize(10);
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
        longitude: locationLon
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
        users: { connect: { id: userId } },
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
        preferredInstruments: [],
        preferredSkills: [],
        matchMusicTastes: faker.datatype.boolean()
      };
      preferencesToCreate.push(preferencesData);
      const photoCount = faker.number.int({ min: 1, max: 4 });
      for (let k = 0; k < photoCount; k++) {
        const photoId = generateIdFromEntropySize(10);
        const photoData = {
          id: photoId,
          users: { connect: { id: userId } },
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
    const username = `dating_user_${userIndex + 1}`;
    const email = `dating_user_${userIndex + 1}${testDomain}`;
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
      displayName: faker.person.fullName(),
      passwordHash: hashedPassword,
      isVerified: true,
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
    const profileId = generateIdFromEntropySize(10);
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
      longitude: locationLon
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
      users: { connect: { id: userId } },
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
      preferredInstruments: [],
      // Can be populated if needed
      preferredSkills: [],
      // Can be populated if needed
      matchMusicTastes: faker.datatype.boolean()
    };
    preferencesToCreate.push(preferencesData);
    const photoCount = faker.number.int({ min: 1, max: 4 });
    for (let k = 0; k < photoCount; k++) {
      const photoId = generateIdFromEntropySize(10);
      const photoData = {
        id: photoId,
        users: { connect: { id: userId } },
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
    const createdUserIds = new Set(actualCreatedUsers.map((u) => u.id));
    console.log(`...Fetched ${actualCreatedUsers.length} actual users from DB.`);
    const validProfiles = profilesToCreate.filter((p) => {
      const userId = p.user.connect.id;
      return createdUserIds.has(userId);
    });
    const validPreferences = preferencesToCreate.filter((p) => {
      const userId = p.users.connect.id;
      return createdUserIds.has(userId);
    });
    const validPhotos = photosToCreate.filter((p) => {
      const userId = p.users.connect.id;
      return createdUserIds.has(userId);
    });
    if (validProfiles.length < profilesToCreate.length) {
      console.log(
        `...Filtered out ${profilesToCreate.length - validProfiles.length} profiles for users that weren't created (duplicates).`
      );
    }
    if (streamClient) {
      const streamChatUsers = usersToCreate.filter((user) => createdUserIds.has(user.id)).map((user) => ({
        id: user.id,
        name: user.displayName,
        image: user.avatarUrl,
        email: user.email
      }));
      try {
        const batchSize = 100;
        let upsertedCount = 0;
        for (let i = 0; i < streamChatUsers.length; i += batchSize) {
          const batch = streamChatUsers.slice(i, i + batchSize);
          await streamClient.upsertUsers(batch);
          upsertedCount += batch.length;
          console.log(`...${upsertedCount}/${streamChatUsers.length} users upserted to StreamChat.`);
        }
        console.log(
          `...${streamChatUsers.length} users upserted to StreamChat.`
        );
      } catch (error) {
        console.error(
          `Failed to add users to StreamChat:`,
          error.message
        );
      }
    }
    console.log(`Creating ${validProfiles.length} dating profiles...`);
    for (const profile of validProfiles) {
      await tx.user_dating_profile.create({
        data: profile
      });
    }
    console.log(`...${validProfiles.length} profiles created.`);
    console.log(`Creating ${validPreferences.length} dating preferences...`);
    for (const prefs of validPreferences) {
      await tx.user_dating_preferences.create({
        data: prefs
      });
    }
    console.log(`...${validPreferences.length} preferences created.`);
    console.log(`Creating ${validPhotos.length} user photos...`);
    for (const photo of validPhotos) {
      await tx.user_photos.create({
        data: photo
      });
    }
    console.log(`...${validPhotos.length} photos created.`);
    if (swipesToCreate.length > 0) {
      console.log(`Creating ${swipesToCreate.length} swipes for test users...`);
      for (const swipe of swipesToCreate) {
        try {
          await tx.swipes.create({
            data: {
              id: generateIdFromEntropySize(10),
              fromUserId: swipe.fromUserId,
              toUserId: swipe.toUserId,
              direction: swipe.direction,
              createdAt: /* @__PURE__ */ new Date()
            }
          });
        } catch (error) {
          console.warn(`Swipe already exists or error: ${error.message}`);
        }
      }
      console.log(`...${swipesToCreate.length} swipes created.`);
    }
    if (matchesToCreate.length > 0) {
      console.log(`Creating ${matchesToCreate.length} matches for test users...`);
      for (const match of matchesToCreate) {
        try {
          await tx.matches.create({
            data: {
              id: generateIdFromEntropySize(10),
              user1Id: match.user1Id,
              user2Id: match.user2Id,
              createdAt: /* @__PURE__ */ new Date()
            }
          });
        } catch (error) {
          console.warn(`Match already exists or error: ${error.message}`);
        }
      }
      console.log(`...${matchesToCreate.length} matches created.`);
    }
    console.log(
      `Dating seeding complete: ${createdDatingUsers.length} users with profiles, preferences, photos, swipes, and matches.`
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

// prisma/seedDatingOnly.ts
var {
  prisma,
  streamChatClient: streamChatClient2,
  passwordHash: passwordHash2
} = await import("./seedUtils-YXFADVGQ.js");
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
