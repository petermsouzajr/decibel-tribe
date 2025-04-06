// /// <reference types="vitest/globals" />
import { google } from "@/auth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { GET } from "@/app/(auth)/login/google/route";

vi.mock("@/auth", () => ({
  google: {
    createAuthorizationURL: vi.fn(),
  },
}));

vi.mock("arctic", () => ({
  generateCodeVerifier: vi.fn(),
  generateState: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
  })),
}));

describe("GET", () => {
  const TEST_STATE = "test-state";
  const TEST_CODE_VERIFIER = "test-code-verifier";
  const AUTH_URL = "http://example.com/";

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    generateState.mockReturnValue(TEST_STATE);
    // @ts-ignore
    generateCodeVerifier.mockReturnValue(TEST_CODE_VERIFIER);
    // @ts-ignore
    google.createAuthorizationURL.mockResolvedValue(AUTH_URL);
  });

  it("should generate state and code verifier", async () => {
    await GET();

    expect(generateState).toHaveBeenCalled();
    expect(generateCodeVerifier).toHaveBeenCalled();
  });

  it("should create authorization URL with correct parameters", async () => {
    await GET();

    expect(google.createAuthorizationURL).toHaveBeenCalledWith(
      TEST_STATE,
      TEST_CODE_VERIFIER,
      { scopes: ["profile", "email"] },
    );
  });

  it("should set cookies with correct options", async () => {
    const mockCookies = {
      set: vi.fn(),
    };
    // @ts-ignore
    cookies.mockReturnValue(mockCookies);

    await GET();

    expect(mockCookies.set).toHaveBeenCalledWith("state", TEST_STATE, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax",
    });
    expect(mockCookies.set).toHaveBeenCalledWith(
      "code_verifier",
      TEST_CODE_VERIFIER,
      {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "lax",
      },
    );
  });

  it("should return a redirect response", async () => {
    const response = await GET();

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(AUTH_URL);
  });
});
