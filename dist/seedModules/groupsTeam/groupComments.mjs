import { faker, generateIdFromEntropySize, accountDataGenerator,
// prisma is passed as an argument
 } from "../../seedUtils.mjs"; // Corrected path and extension
const userQuantity = 1; // Consider moving to seedUtils
export async function seedGroupComments(prismaClient, createdGroupPosts, createdGroupMembers, createdUsers) {
    if (!prismaClient) {
        console.error("Prisma client is not available for seedGroupComments.");
        return [];
    }
    if (!createdGroupPosts || createdGroupPosts.length === 0) {
        console.log("No group posts provided for group comment creation. Skipping.");
        return [];
    }
    if (!createdGroupMembers || createdGroupMembers.length === 0) {
        console.log("No group members provided for group comment creation. Skipping.");
        return [];
    }
    if (!createdUsers || createdUsers.length === 0) {
        console.log("No users provided for group comment creation. Skipping.");
        return [];
    }
    console.log("Creating group comments...");
    const commentsData = []; // Use correct type
    const createdCommentsForReturn = [];
    // Create maps for efficient lookups
    const membersByGroup = new Map();
    for (const member of createdGroupMembers) {
        if (member.acceptedInvite) {
            if (!membersByGroup.has(member.groupId)) {
                membersByGroup.set(member.groupId, []);
            }
            membersByGroup.get(member.groupId).push(member);
        }
    }
    for (const post of createdGroupPosts) {
        const membersInGroup = membersByGroup.get(post.groupId);
        if (!membersInGroup || membersInGroup.length === 0) {
            continue; // Skip post if group has no accepted members
        }
        const commentQuantity = accountDataGenerator("random", 1, 10);
        for (let i = 0; i < commentQuantity; i++) {
            const commenterMember = faker.helpers.arrayElement(membersInGroup); // Only accepted members can comment
            const commentId = generateIdFromEntropySize(10);
            const createdAtDate = faker.date.between({
                // Ensure comment is after post
                from: new Date(post.createdAt),
                to: new Date(),
            });
            const commentInput = {
                id: commentId,
                content: `group comment ${faker.lorem.sentence()}`,
                // Use direct foreign keys
                userId: commenterMember.userId,
                postId: post.id,
                // groupId is likely not part of CommentCreateManyInput
                createdAt: createdAtDate,
            };
            commentsData.push(commentInput);
            createdCommentsForReturn.push({
                id: commentId,
                userId: commenterMember.userId,
                postId: post.id,
            });
        }
    }
    if (commentsData.length === 0) {
        console.log("...No group comments generated to create.");
        return [];
    }
    try {
        // Note: Using Comment model
        await prismaClient.comment.createMany({
            data: commentsData,
            skipDuplicates: true,
        });
        console.log(`...${commentsData.length} group post comments created!`);
    }
    catch (error) {
        console.error("Error creating group comments in DB:", error);
        return []; // Return empty on DB error
    }
    return createdCommentsForReturn;
}
