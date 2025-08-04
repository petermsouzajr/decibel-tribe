import GoogleSignInButton from "@/app/(auth)/login/google/GoogleSignInButton";
import { render, screen } from "@testing-library/react";

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    render(<GoogleSignInButton />);
  });

  it("should render the link text", () => {
    const button = screen.getByRole("link", { name: /Use Google/i });
    expect(button).toBeInTheDocument();
  });

  it("should render the link with correct href", () => {
    const link = screen.getByRole("link", { name: /Use Google/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login/google");
  });
});
