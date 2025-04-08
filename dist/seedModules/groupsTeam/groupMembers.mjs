import { GroupRole } from "@prisma/client";
import { faker, generateIdFromEntropySize, accountDataGenerator, } from "../../seedUtils.mjs";
export async function seedGroupMembers(prismaClient, createdUsers, createdGroups) {
    if (!prismaClient) {
        console.error("Prisma client is not available for seedGroupMembers.");
        return [];
    }
    if (!createdUsers || createdUsers.length === 0) {
        console.log("No users provided for group member creation. Skipping.");
        return [];
    }
    if (!createdGroups || createdGroups.length === 0) {
        console.log("No groups provided for group member creation. Skipping.");
        return [];
    }
    console.log("Creating group members...");
    const membersData = [];
    const createdMembersForReturn = [];
    const eligibleUsers = createdUsers.filter((u) => !u.username.includes("noGroupMemberships"));
    if (eligibleUsers.length === 0) {
        console.log("No eligible users found to create group members.");
        return [];
    }
    for (const group of createdGroups) {
        const ownerUser = eligibleUsers.find((u) => u.id === group.ownerId);
        if (ownerUser) {
            const ownerMemberId = generateIdFromEntropySize(10);
            const ownerJoinedAt = new Date(Math.max(ownerUser.createdAt.getTime(), group.createdAt.getTime()));
            membersData.push({
                id: ownerMemberId,
                userId: ownerUser.id,
                groupId: group.id,
                role: GroupRole.ADMIN,
                joinedAt: ownerJoinedAt,
                acceptedInvite: true,
            });
            createdMembersForReturn.push({
                id: ownerMemberId,
                userId: ownerUser.id,
                groupId: group.id,
                role: GroupRole.ADMIN,
                joinedAt: ownerJoinedAt,
                acceptedInvite: true,
            });
        }
        else {
            if (createdUsers.some((u) => u.id === group.ownerId)) {
                console.warn(`Owner ${group.ownerId} for group ${group.id} was ineligible.`);
            }
        }
        const memberQuantity = accountDataGenerator("random", 1, 15);
        const potentialMembers = faker.helpers.shuffle(eligibleUsers.filter((u) => u.id !== group.ownerId));
        for (let i = 0; i < memberQuantity && i < potentialMembers.length; i++) {
            const memberUser = potentialMembers[i];
            const memberId = generateIdFromEntropySize(10);
            const memberRole = faker.helpers.arrayElement([
                GroupRole.MEMBER,
                GroupRole.ADMIN,
            ]);
            const acceptedInvite = faker.datatype.boolean();
            const earliestJoinDate = new Date(Math.max(memberUser.createdAt.getTime(), group.createdAt.getTime()));
            const joinedAt = faker.date.between({
                from: earliestJoinDate,
                to: new Date(),
            });
            const memberInput = {
                id: memberId,
                userId: memberUser.id,
                groupId: group.id,
                role: memberRole,
                acceptedInvite: acceptedInvite,
                joinedAt: joinedAt,
            };
            membersData.push(memberInput);
            createdMembersForReturn.push({
                id: memberId,
                userId: memberUser.id,
                groupId: group.id,
                role: memberRole,
                joinedAt: joinedAt,
                acceptedInvite: acceptedInvite,
            });
        }
    }
    if (membersData.length === 0) {
        console.log("...No group memberships generated to create.");
        return [];
    }
    try {
        await prismaClient.groupMember.createMany({
            data: membersData,
            skipDuplicates: true,
        });
        console.log(`...${membersData.length} potential members across ${createdGroups.length} groups created!`);
    }
    catch (error) {
        console.error("Error creating group members in DB:", error);
        return []; // Return empty on DB error
    }
    return createdMembersForReturn;
}
