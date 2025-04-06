import { render, screen } from "@testing-library/react";
import { expect } from "vitest";
import Page from "@/app/(auth)/signup/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: "/",
  }),
}));

describe("Sign Up Page", () => {
  beforeEach(() => {
    render(<Page />);
  });

  it("should render the main heading", () => {
    const heading = screen.getByRole("heading", { name: /Decibel Tribe/i });
    expect(heading).toBeInTheDocument();
  });

  it("should render the subheading", () => {
    const subheading = screen.getByText(/Stay Human/i);
    expect(subheading).toBeInTheDocument();
  });

  it("should render the Google Sign-Up button", () => {
    const googleButton = screen.getByRole("link", {
      name: /Use Google/i,
    });
    expect(googleButton).toBeInTheDocument();
  });

  it("should render the sign-up form", () => {
    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email/i);
    expect(usernameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
  });

  it("should render the login link", () => {
    const loginLink = screen.getByRole("link", {
      name: /Already have an account\? Log in/i,
    });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("should hide the image on smaller screens", () => {
    global.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));

    const image = screen.getByAltText("");
    expect(image).toHaveClass("hidden");
  });

  it("should render the signup image", () => {
    const image = screen.getByAltText("");
    expect(image).toBeInTheDocument();
  });

  it("should match the snapshot", () => {
    expect(document.body).toMatchSnapshot();
  });
});
