import React from "react";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import { vi } from "vitest";
import Layout from "@/app/(auth)/layout";

// NOTE: Skipping this test suite due to persistent issues rendering the async layout component
// in the JSDOM environment. Needs further investigation.
vi.mock("@/auth", () => ({
  validateRequest: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Layout (Auth)", () => {
  const mockChildren = <div>Child Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call validateRequest", async () => {
    vi.mocked(validateRequest).mockResolvedValue({ user: null, session: null });

    await Layout({ children: mockChildren });

    expect(validateRequest).toHaveBeenCalledTimes(1);
  });

  it("should redirect to home if user is authenticated", async () => {
    const mockUser = {
      id: "user-id",
      username: "testuser",
      displayName: "Test User",
      avatarUrl: null,
      googleId: null,
    };
    vi.mocked(validateRequest).mockResolvedValue({
      user: mockUser as any,
      session: {
        id: "session-id",
        expiresAt: new Date(),
        userId: "user-id",
      } as any,
    });

    await Layout({ children: mockChildren });

    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("should return children if user is not authenticated", async () => {
    vi.mocked(validateRequest).mockResolvedValue({ user: null, session: null });

    const result = await Layout({ children: mockChildren });

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toEqual(<>{mockChildren}</>);
  });
});
