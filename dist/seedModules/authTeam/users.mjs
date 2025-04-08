import { faker, generateIdFromEntropySize, cypressEnv, } from "../../seedUtils.mjs"; // Corrected path and extension
const userQuantity = 1; // Define locally for this module
// Exported function to seed users
export async function seedUsers(prismaClient, streamClient, hasher) {
    if (!prismaClient) {
        console.error("Prisma client is not available for seedUsers.");
        return [];
    }
    console.log("Seeding users...");
    const usersData = []; // Explicitly typed array
    const createdUsersForReturn = [];
    // Use imported cypressEnv
    const userTypes = Object.keys(cypressEnv)
        .filter((key) => key.endsWith("Username"))
        .map((key) => key.replace("Username", ""));
    const quantity = userQuantity;
    const password = cypressEnv.password;
    console.log(`Creating ${quantity * userTypes.length} users...`);
    const hashedPassword = await hasher(password);
    for (const userType of userTypes) {
        for (let i = 0; i < quantity; i++) {
            const userId = generateIdFromEntropySize(10);
            const username = `testUser${userType.charAt(0).toUpperCase() + userType.slice(1)}${quantity > 1 ? i + 1 : ""}`;
            const email = `${username.toLowerCase()}@example.com`;
            const isGoogleLoginUser = username.includes("GoogleLogin");
            const googleId = isGoogleLoginUser
                ? `${faker.string.numeric(10)}${faker.string.alphanumeric(10)}`
                : null;
            const userPasswordHash = isGoogleLoginUser ? null : hashedPassword;
            const isVerified = !userType.includes("unverified");
            const hasAvatar = !userType.includes("noAvatar") && Math.random() < 0.8;
            let avatarUrl = hasAvatar
                ? `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`
                : null;
            const isNoBioUser = username.includes("NoBio");
            const bio = isNoBioUser ? null : faker.lorem.sentence();
            const createdAt = faker.date.between({
                from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                to: new Date(),
            });
            const userData = {
                id: userId,
                username,
                email,
                displayName: username,
                passwordHash: userPasswordHash,
                isVerified,
                avatarUrl,
                googleId,
                bio,
                createdAt,
            };
            usersData.push(userData);
            // Add data needed by other modules to the return array
            createdUsersForReturn.push({
                id: userId,
                username: username,
                email: email,
                isVerified: isVerified,
                createdAt: createdAt,
                displayName: username,
                avatarUrl: avatarUrl,
                bio: bio,
                passwordHash: userPasswordHash,
                pendingEmail: null,
                googleId: googleId,
            });
        }
    }
    // Use the passed prismaClient
    try {
        await prismaClient.user.createMany({
            data: usersData,
            skipDuplicates: true,
        });
        console.log(`...${usersData.length} users created in DB.`);
    }
    catch (error) {
        console.error("Error creating users in DB:", error);
        // Decide if we should return early or continue to StreamChat upsert
        return []; // Return empty on DB error for now
    }
    // Add users to StreamChat
    console.log(`Adding ${usersData.length} users to StreamChat...`);
    const streamChatUsers = usersData.map((user) => ({
        id: user.id,
        name: user.displayName,
        image: user.avatarUrl,
        email: user.email,
        // Add any other custom fields needed by StreamChat
    }));
    // Use the passed streamClient
    if (streamClient) {
        try {
            await streamClient.upsertUsers(streamChatUsers);
            console.log(`...${streamChatUsers.length} users upserted to StreamChat.`);
        }
        catch (error) {
            console.error(`Failed to add users to StreamChat:`, error.message);
            // Log error but don't necessarily fail the whole seed process
        }
    }
    else {
        console.warn("Stream Chat client not available. Skipping Stream Chat user upsert.");
    }
    return createdUsersForReturn; // Return the specifically structured data
}
