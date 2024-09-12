import { render, screen } from "@testing-library/react";
import Page from "../page";

describe("Page Component", () => {
  it("renders the main heading", () => {
    render(<Page />);
    const heading = screen.getByRole("heading", { name: /Decibel Tribe/i });
    expect(heading).toBeInTheDocument();
  });

  it("renders the subheading", () => {
    render(<Page />);
    const subheading = screen.getByText(/Stay Human/i);
    expect(subheading).toBeInTheDocument();
  });

  it("renders the resend verification email form", () => {
    render(<Page />);
    const formHeading = screen.getByRole("heading", {
      name: /Resend Verification Email/i,
    });
    expect(formHeading).toBeInTheDocument();
  });

  it("renders the signup link", () => {
    render(<Page />);
    const signupLink = screen.getByRole("link", { name: /Sign up/i });
    expect(signupLink).toBeInTheDocument();
  });

  it("renders the back to login link", () => {
    render(<Page />);
    const loginLink = screen.getByRole("link", { name: /Back to Login/i });
    expect(loginLink).toBeInTheDocument();
  });
});
