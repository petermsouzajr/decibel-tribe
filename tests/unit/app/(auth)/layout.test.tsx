import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { validateRequest } from "@/auth";
import Layout from "@/app/(auth)/layout";
import { redirect } from "next/navigation";

vi.mock("@/auth", () => ({
  validateRequest: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateRequest).mockResolvedValue({ user: null, session: null });
    render(
      <React.Suspense fallback={<div>Loading...</div>}>
        <Layout children={<div>Child Content</div>} />
      </React.Suspense>,
    );
  });

  it("should call validateRequest", async () => {
    await waitFor(() => {
      expect(validateRequest).toHaveBeenCalled();
    });
  });

  it("should redirect to home if user is authenticated", async () => {
    vi.mocked(validateRequest).mockResolvedValue({
      user: { id: "user-id" } as any,
      session: {
        id: "session-id",
        expiresAt: new Date(),
        userId: "user-id",
      } as any,
    });

    render(
      <React.Suspense fallback={<div>Loading...</div>}>
        <Layout children={<div>Child Content</div>} />
      </React.Suspense>,
    );

    await waitFor(() => {
      expect(redirect).toHaveBeenCalledWith("/");
    });
  });

  it("should render children if user is not authenticated", async () => {
    await waitFor(() => {
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });
  });
});
