import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
// Remove static import of route handler
// import { POST } from "@/app/api/groups/route";
import { NextRequest } from "next/server";
// Remove static imports of mocked modules
// import { cookies } from "next/headers";
// import { lucia } from "@/auth";
// import prisma from "@/lib/prisma";

// --- Declare Hoisted Mock Function Variables FIRST ---
const { mockCookiesGet, mockCookiesSet } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockCookiesSet: vi.fn(),
}));
const {
  mockLuciaValidateSession,
  mockCreateBlankSessionCookie,
  mockCreateSessionCookie,
} = vi.hoisted(() => ({
  mockLuciaValidateSession: vi.fn(),
  mockCreateBlankSessionCookie: vi.fn(),
  mockCreateSessionCookie: vi.fn(),
}));
const { mockPrismaGroupCreate } = vi.hoisted(() => ({
  mockPrismaGroupCreate: vi.fn(),
}));
const luciaSessionCookieName = "auth_session";

// --- Top-Level Mocks using vi.mock ---
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookiesGet, set: mockCookiesSet })),
}));

vi.mock("@/auth", () => ({
  // Routes call this helper (src/auth.ts) instead of lucia directly;
  // delegate to the validateSession mock this file already configures.
  validateRequestWithCookieMutation: vi.fn(
    async () => (await mockLuciaValidateSession()) ?? { user: null, session: null },
  ),
  lucia: {
    sessionCookieName: "auth_session", // Hardcode string literal
    validateSession: mockLuciaValidateSession,
    createBlankSessionCookie: mockCreateBlankSessionCookie,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: { group: { create: mockPrismaGroupCreate } },
}));

// --- Import Route Handler AFTER Top-Level Mocks ---
import { POST } from "@/app/api/groups/route";

// Helper function - Can reference hoisted mocks
const mockSessionValidation = (user: any, session: any) =>
  mockLuciaValidateSession?.mockResolvedValue({ user, session });

// --- Test Data ---
const testUser = { id: "user_group_test", username: "groupuser" };
const testSession = { id: "session_group_test", fresh: false };
const mockCreatedGroup = {
  id: "group_new",
  name: "New Test Group",
  description: "A description",
  ownerId: testUser.id, // Include ownerId if returned by API
};
const mockCreatedMember = {
  id: "member_new",
  userId: testUser.id,
  groupId: mockCreatedGroup.id,
  role: "ADMIN",
};

// --- Test Suite ---
describe("API Route: POST /api/groups", () => {
  let request: NextRequest;
  let mockReqJson: Mock = vi.fn(); // Initialize mock for req.json()

  beforeEach(() => {
    // 1. Reset Mocks
    vi.resetAllMocks();

    // 2. Define Mock Implementations and Default Behaviors
    // Note: hoisted variables are already vi.fn(), just set defaults
    mockCookiesGet.mockReturnValue({ value: "valid_session_id" });
    mockLuciaValidateSession.mockResolvedValue({
      user: testUser,
      session: testSession,
    });
    mockCreateBlankSessionCookie.mockReturnValue({
      name: luciaSessionCookieName,
      value: "",
      attributes: { path: "/", httpOnly: true, maxAge: 0 },
    });
    mockCreateSessionCookie.mockReturnValue({
      name: luciaSessionCookieName,
      value: testSession.id, // Use test session ID
      attributes: { path: "/", httpOnly: true /* other attributes */ },
    });
    mockPrismaGroupCreate.mockResolvedValue(mockCreatedGroup);
    mockReqJson.mockResolvedValue({
      name: "Default Group",
      description: "Default Desc",
    }); // Default request body

    // 3. Create base request
    request = new NextRequest("http://localhost/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Body is mocked via request.json
    });
    // Crucially, attach the mock json method to the instance
    request.json = mockReqJson;
  });

  // afterEach can stay if needed for spies, otherwise remove if just using clearAllMocks
  // afterEach(() => { ... });

  // --- Authentication Tests ---
  it("should return 401 if user is not authenticated", async () => {
    // Arrange: Override defaults for auth failure
    mockCookiesGet.mockReturnValue(undefined); // No session cookie
    mockLuciaValidateSession.mockResolvedValue({ user: null, session: null });
    mockReqJson.mockResolvedValue({ name: "Test Group" }); // Still need a body

    // Act
    const response = await POST(request);

    // Assert
    expect(response.status).toBe(401);
    // Because the cookie is missing, validateSession should NOT be called
    expect(mockLuciaValidateSession).not.toHaveBeenCalled();
    expect(mockPrismaGroupCreate).not.toHaveBeenCalled();
  });

  // --- Input Validation Tests ---
  it("should return 400 if group name is missing", async () => {
    // Arrange: Set specific invalid body via mockReqJson
    mockReqJson.mockResolvedValue({ description: "No name" });

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body.error).toContain("Group name must be");
  });

  it("should return 400 if group name is too short", async () => {
    // Arrange: Set specific invalid body via mockReqJson
    mockReqJson.mockResolvedValue({ name: "AB" });

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(body.error).toContain("Group name must be");
  });

  // --- Success Path ---
  it("should create group and admin membership via nested write on valid input", async () => {
    // Arrange: Set specific valid body via mockReqJson
    const groupData = {
      name: "Valid Group Name",
      description: "Optional Desc",
    };
    mockReqJson.mockResolvedValue(groupData);
    // Default mocks for auth and prisma create success are fine

    // Act
    await POST(request);

    // Assert
    expect(mockPrismaGroupCreate).toHaveBeenCalledTimes(1);
    expect(mockPrismaGroupCreate).toHaveBeenCalledWith({
      data: {
        name: groupData.name,
        description: groupData.description,
        ownerId: testUser.id,
        members: {
          create: {
            userId: testUser.id,
            role: "ADMIN",
            acceptedInvite: true,
          },
        },
      },
    });
  });

  it("should return 201 with created group data on success", async () => {
    // Arrange: Set specific valid body via mockReqJson
    const groupData = { name: "Success Group" };
    mockReqJson.mockResolvedValue(groupData);
    // Mock prisma create to return the expected structure
    mockPrismaGroupCreate.mockResolvedValue({
      ...mockCreatedGroup,
      name: groupData.name, // Use the name from the request
      description: undefined, // Reflect potential undefined description
    });

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(201);
    // Check against the dynamically created mock data for this test
    expect(body).toEqual({
      ...mockCreatedGroup,
      name: groupData.name,
      description: undefined,
    });
  });

  // --- Error Handling ---
  it("should return 500 if reading request body fails", async () => {
    // Arrange: Make req.json() throw an error
    const parseError = new SyntaxError("Simulated JSON parse error");
    mockReqJson.mockRejectedValue(parseError);
    // Auth mock is fine (default success)

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error"); // Check for standard error message
  });

  it("should return 500 if prisma create fails", async () => {
    // Arrange: Set valid body and make prisma fail
    const dbError = new Error("DB Create failed explicitly for test");
    mockReqJson.mockResolvedValue({ name: "Error Group" });
    mockPrismaGroupCreate.mockRejectedValue(dbError);

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe("Internal server error"); // Check for standard error message
  });
});
