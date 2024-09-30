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
    render(<Layout children={<div></div>} />);
  });

  it("should call validateRequest", async () => {
    //@ts-ignore
    validateRequest.mockResolvedValue({ user: null });

    await waitFor(() => {
      expect(validateRequest).toHaveBeenCalled();
    });
  });

  it("should redirect to home if user is authenticated", async () => {
    //@ts-ignore
    validateRequest.mockResolvedValue({ user: { id: "user-id" } });

    //@ts-ignore
    await waitFor(() => {
      expect(redirect).toHaveBeenCalledWith("/");
    });
  });

  it("should render children if user is not authenticated", async () => {
    //@ts-ignore
    validateRequest.mockResolvedValue({ user: null });

    await waitFor(() => {
      expect(document.querySelector("div")).toBeInTheDocument();
    });
  });
});
