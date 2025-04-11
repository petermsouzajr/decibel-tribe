import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { Prisma, NotificationType } from "@prisma/client";

// --- Mocks ---

// Mock seedUtils dependencies
const mockFakerDatatypeBoolean = vi.fn();
const mockFakerDateRecent = vi.fn();

vi.mock("../../seedUtils.mjs", () => ({
  faker: {
    datatype: { boolean: mockFakerDatatypeBoolean },
    date: { recent: mockFakerDateRecent },
  },
}));

// Mock Prisma Client passed as argument
const mockPrismaClient = {
  notification: {
    createMany: vi.fn(),
  },
};

// --- Test Suite ---

// Import the function to test
const { seedNotifications } = await import("./notifications.js");

describe("NotificationsTeam - seedNotifications Module", () => {
  const mockPosts = [
    { id: "post1", userId: "userP1" },
    { id: "post2", userId: "userP2" },
  ];
  const mockComments = [
    { id: "c1", postId: "post1", userId: "userC1" }, // Notify userP1
    { id: "c2", postId: "post2", userId: "userP1" }, // Notify userP2
    { id: "c3", postId: "post1", userId: "userP1" }, // Self-comment, no notification
  ];
  const mockLikes = [
    { postId: "post1", userId: "userL1" }, // Notify userP1
    { postId: "post2", userId: "userP1" }, // Notify userP2
  ];
  const mockDislikes = [{ postId: "post1", userId: "userD1" }]; // Notify userP1
  const mockFollows = [
    { followerId: "userF1", followingId: "userR1" }, // Notify userR1
    { followerId: "userF2", followingId: "userR2" }, // Notify userR2
  ];
  const mockEvents = [
    { id: "event1", createdById: "userEC1", isCancelled: false },
    { id: "event2", createdById: "userEC2", isCancelled: true }, // Cancelled
  ];
  const mockAttendees = [
    { userId: "userA1", eventId: "event1" }, // Notify userEC1
    { userId: "userEC1", eventId: "event1" }, // Self-attend, no notification
    { userId: "userA2", eventId: "event2" }, // Notify userA2 of cancellation
    { userId: "userEC2", eventId: "event2" }, // Creator, no cancellation notification
  ];

  const mockRecentDate = new Date("2023-10-26");

  beforeEach(() => {
    vi.clearAllMocks();
    (mockPrismaClient.notification.createMany as Mock).mockResolvedValue({
      count: 10,
    });
    mockFakerDatatypeBoolean.mockReturnValue(false); // Default to read=false
    mockFakerDateRecent.mockReturnValue(mockRecentDate);
  });

  it("should call prisma.notification.createMany with aggregated data for all types", async () => {
    await seedNotifications(
      mockPrismaClient,
      mockPosts,
      mockComments,
      mockLikes,
      mockDislikes,
      mockFollows,
      mockEvents,
      mockAttendees,
    );

    expect(mockPrismaClient.notification.createMany).toHaveBeenCalledOnce();
    const createArgs = (mockPrismaClient.notification.createMany as Mock).mock
      .calls[0][0];
    const createdData: Prisma.NotificationCreateManyInput[] = createArgs.data;

    // Log the actual data being passed to createMany
    // console.log("--- Debug: createdData in aggregated test ---", JSON.stringify(createdData, null, 2)); // Keep commented out or remove

    // Expected counts:
    // Comments: 2 (c1, c2)
    // Likes: 2 (l1, l2)
    // Dislikes: 1 (d1)
    // Follows: 2 (f1->r1, f2->r2)
    // Attendee: 2 (a1->ec1, a2->ec2)
    // Cancelled: 1 (ec2->a2)
    // Total = 2 + 2 + 1 + 2 + 2 + 1 = 10
    expect(createdData.length).toBe(10);
  });

  it("should generate correct COMMENT notifications", async () => {
    await seedNotifications(
      mockPrismaClient,
      mockPosts,
      mockComments,
      [],
      [],
      [],
      [],
      [], // Only test comments
    );
    const createdData = (mockPrismaClient.notification.createMany as Mock).mock
      .calls[0][0].data;
    expect(createdData.length).toBe(2);
    expect(createdData).toContainEqual({
      recipientId: "userP1", // Post owner
      issuerId: "userC1", // Commenter
      postId: "post1",
      type: NotificationType.COMMENT,
      read: expect.any(Boolean),
      createdAt: expect.any(Date),
    });
    expect(createdData).toContainEqual({
      recipientId: "userP2",
      issuerId: "userP1",
      postId: "post2",
      type: NotificationType.COMMENT,
      read: expect.any(Boolean),
      createdAt: expect.any(Date),
    });
  });

  it("should generate correct LIKE notifications", async () => {
    await seedNotifications(
      mockPrismaClient,
      mockPosts,
      [],
      mockLikes,
      [],
      [],
      [],
      [], // Only test likes
    );
    const createdData = (mockPrismaClient.notification.createMany as Mock).mock
      .calls[0][0].data;
    expect(createdData.length).toBe(2);
    expect(createdData).toContainEqual({
      recipientId: "userP1",
      issuerId: "userL1",
      postId: "post1",
      type: NotificationType.LIKE,
      read: expect.any(Boolean),
      createdAt: expect.any(Date),
    });
  });

  it("should generate correct DISLIKE notifications", async () => {
    await seedNotifications(
      mockPrismaClient,
      mockPosts,
      [],
      [],
      mockDislikes,
      [],
      [],
      [], // Only test dislikes
    );
    const createdData = (mockPrismaClient.notification.createMany as Mock).mock
      .calls[0][0].data;
    expect(createdData.length).toBe(1);
    expect(createdData[0]).toEqual({
      recipientId: "userP1",
      issuerId: "userD1",
      postId: "post1",
      type: NotificationType.DISLIKE,
      read: expect.any(Boolean),
      createdAt: expect.any(Date),
    });
  });

  it("should generate correct FOLLOW notifications", async () => {
    await seedNotifications(
      mockPrismaClient,
      [],
      [],
      [],
      [],
      mockFollows,
      [],
      [], // Only test follows
    );
    const createdData = (mockPrismaClient.notification.createMany as Mock).mock
      .calls[0][0].data;
    expect(createdData.length).toBe(2);
    expect(createdData).toContainEqual({
      recipientId: "userR1",
      issuerId: "userF1",
      type: NotificationType.FOLLOW,
      read: expect.any(Boolean),
      createdAt: expect.any(Date),
    });
  });

  it("should generate correct EVENT_ATTENDEE notifications", async () => {
    await seedNotifications(
      mockPrismaClient,
      [],
      [],
      [],
      [],
      [],
      mockEvents,
      mockAttendees, // Test attendees
    );
    const createdData = (mockPrismaClient.notification.createMany as Mock).mock
      .calls[0][0].data;
    const attendeeNotifications = createdData.filter(
      (n: any) => n.type === NotificationType.EVENT_ATTENDEE,
    );
    expect(attendeeNotifications.length).toBe(2);
    expect(attendeeNotifications).toContainEqual({
      recipientId: "userEC1", // Event Creator
      issuerId: "userA1", // Attendee
      eventId: "event1",
      type: NotificationType.EVENT_ATTENDEE,
      read: expect.any(Boolean),
      createdAt: expect.any(Date),
    });
    expect(attendeeNotifications).toContainEqual({
      recipientId: "userEC2", // Event Creator
      issuerId: "userA2", // Attendee
      eventId: "event2",
      type: NotificationType.EVENT_ATTENDEE,
      read: expect.any(Boolean),
      createdAt: expect.any(Date),
    });
  });

  it("should generate correct EVENT_CANCELLED notifications", async () => {
    await seedNotifications(
      mockPrismaClient,
      [],
      [],
      [],
      [],
      [],
      mockEvents,
      mockAttendees, // Test cancellations
    );
    const createdData = (mockPrismaClient.notification.createMany as Mock).mock
      .calls[0][0].data;
    const cancelledNotifications = createdData.filter(
      (n: any) => n.type === NotificationType.EVENT_CANCELLED,
    );
    expect(cancelledNotifications.length).toBe(1);
    expect(cancelledNotifications[0]).toEqual({
      recipientId: "userA2", // Attendee
      issuerId: "userEC2", // Event Creator
      eventId: "event2",
      type: NotificationType.EVENT_CANCELLED,
      read: expect.any(Boolean),
      createdAt: expect.any(Date),
    });
  });

  it("should not generate self-notifications (comment, like, dislike, attendee)", async () => {
    await seedNotifications(
      mockPrismaClient,
      mockPosts,
      mockComments,
      mockLikes,
      mockDislikes,
      mockFollows,
      mockEvents,
      mockAttendees,
    );
    const createdData = (mockPrismaClient.notification.createMany as Mock).mock
      .calls[0][0].data;

    const selfNotifications = createdData.filter(
      (n: any) => n.recipientId === n.issuerId,
    );
    expect(selfNotifications.length).toBe(0);
  });

  it("should not call createMany if no notifications generated", async () => {
    await seedNotifications(mockPrismaClient, [], [], [], [], [], [], []);
    expect(mockPrismaClient.notification.createMany).not.toHaveBeenCalled();
  });

  it("should log error if prisma create fails", async () => {
    const dbError = new Error("DB Notification Write Failed");
    (mockPrismaClient.notification.createMany as Mock).mockRejectedValue(
      dbError,
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await seedNotifications(
      mockPrismaClient,
      mockPosts,
      mockComments,
      mockLikes,
      mockDislikes,
      mockFollows,
      mockEvents,
      mockAttendees,
    );

    expect(mockPrismaClient.notification.createMany).toHaveBeenCalledOnce(); // Still attempted
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error creating notifications in DB:",
      dbError,
    );

    consoleErrorSpy.mockRestore();
  });
});
