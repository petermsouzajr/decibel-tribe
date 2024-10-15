import { logout } from "@/app/(auth)/actions";
import { describe, it, expect, vi } from "vitest";

describe("logout", () => {
  it("should throw an error if there is no session", async () => {
    const validateRequestMock = vi.fn().mockResolvedValue({ session: null });

    await expect(
      logout({ validateRequest: validateRequestMock }),
    ).rejects.toThrow("Unauthorized");
  });

  it("should invalidate the session if there is a valid session", async () => {
    const mockSession = { id: "session-id" };
    const validateRequestMock = vi
      .fn()
      .mockResolvedValue({ session: mockSession });
    const invalidateSessionMock = vi.fn();
    const luciaMock = {
      invalidateSession: invalidateSessionMock,
      createBlankSessionCookie: vi.fn(() => ({
        name: "session",
        value: "blank-cookie-value",
        attributes: {},
      })),
    };
    const cookiesSetMock = vi.fn();
    const cookiesMock = () => ({ set: cookiesSetMock });
    const redirectMock = vi.fn();

    await logout({
      validateRequest: validateRequestMock,
      // @ts-ignore
      lucia: luciaMock,
      // @ts-ignore
      cookies: cookiesMock,
      // @ts-ignore
      redirect: redirectMock,
    });

    expect(invalidateSessionMock).toHaveBeenCalledWith(mockSession.id);
  });

  it("should create and set a blank session cookie", async () => {
    const mockSession = { id: "session-id" };
    const validateRequestMock = vi
      .fn()
      .mockResolvedValue({ session: mockSession });
    const createBlankSessionCookieMock = vi.fn().mockReturnValue({
      name: "session",
      value: "blank-cookie-value",
      attributes: { path: "/", httpOnly: true, secure: true },
    });
    const luciaMock = {
      invalidateSession: vi.fn(),
      createBlankSessionCookie: createBlankSessionCookieMock,
    };
    const cookiesSetMock = vi.fn();
    const cookiesMock = () => ({ set: cookiesSetMock });
    const redirectMock = vi.fn();

    await logout({
      validateRequest: validateRequestMock,
      // @ts-ignore
      lucia: luciaMock,
      // @ts-ignore
      cookies: cookiesMock,
      // @ts-ignore
      redirect: redirectMock,
    });

    expect(cookiesSetMock).toHaveBeenCalledWith(
      "session",
      "blank-cookie-value",
      { path: "/", httpOnly: true, secure: true },
    );
  });

  it('should redirect to "/login"', async () => {
    const mockSession = { id: "session-id" };
    const validateRequestMock = vi
      .fn()
      .mockResolvedValue({ session: mockSession });
    const luciaMock = {
      invalidateSession: vi.fn(),
      createBlankSessionCookie: vi.fn(() => ({
        name: "session",
        value: "blank-cookie-value",
        attributes: {},
      })),
    };
    const cookiesMock = () => ({ set: vi.fn() });
    const redirectMock = vi.fn();

    await logout({
      validateRequest: validateRequestMock,
      // @ts-ignore
      lucia: luciaMock,
      // @ts-ignore
      cookies: cookiesMock,
      // @ts-ignore
      redirect: redirectMock,
    });

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
