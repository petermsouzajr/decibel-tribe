import { faker } from "@faker-js/faker";
// Import needed functions directly with correct names
import { accountDataGenerator, generateIdFromEntropySize, // Correct function name
 } from "../../seedUtils.mjs";
export const seedPublicComments = async (prisma, createdUsers, createdPosts, 
// Add optional dependencies argument
dependencies) => {
    var _a;
    // Resolve dependencies: use injected or imported default
    const resolvedGenerateId = (_a = dependencies === null || dependencies === void 0 ? void 0 : dependencies.generateId) !== null && _a !== void 0 ? _a : generateIdFromEntropySize;
    // Early exit conditions
    if (!createdUsers || createdUsers.length === 0) {
        console.log("No users provided for comment creation. Skipping.");
        return [];
    }
    if (!createdPosts || createdPosts.length === 0) {
        console.log("No posts provided for comment creation. Skipping.");
        return [];
    }
    console.log("Creating public comments...");
    // Filter for public posts only
    const eligiblePosts = createdPosts.filter((p) => p.groupId === null);
    if (eligiblePosts.length === 0) {
        console.log("...No public posts available for commenting. Skipping.");
        return [];
    }
    // Create a map for efficient user lookup
    const userMap = new Map(createdUsers.map((user) => [user.id, user]));
    const commentsData = [];
    for (const post of eligiblePosts) {
        const postAuthor = userMap.get(post.userId);
        // Skip posts by users with "noComments" in their username
        if (postAuthor === null || postAuthor === void 0 ? void 0 : postAuthor.username.includes("noComments")) {
            continue;
        }
        const commentQuantity = accountDataGenerator("random", 1, 15);
        // Use all users as potential commenters *excluding the post author*
        const potentialCommenters = createdUsers.filter((u) => u.id !== post.userId);
        if (potentialCommenters.length === 0)
            continue; // Cannot comment if only author exists
        for (let i = 0; i < commentQuantity; i++) {
            const commenter = faker.helpers.arrayElement(potentialCommenters);
            commentsData.push({
                id: resolvedGenerateId(16), // Use resolved generateId (takes entropy size)
                content: `public comment ${faker.lorem.sentence(5)}`,
                userId: commenter.id,
                postId: post.id,
                createdAt: faker.date.between({
                    from: post.createdAt,
                    to: new Date(),
                }),
            });
        }
    }
    if (commentsData.length === 0) {
        console.log("...No eligible posts found for comment creation after filtering.");
        return [];
    }
    try {
        const result = await prisma.comment.createMany({
            data: commentsData,
            skipDuplicates: true,
        });
        console.log(`...${result.count} public comments created!`);
        // Return only the identifiers for potential chaining/linking
        return commentsData.map((comment) => ({
            id: comment.id,
            postId: comment.postId,
            userId: comment.userId,
        }));
    }
    catch (error) {
        console.error("Error creating public comments in DB:", error);
        return [];
    }
};
