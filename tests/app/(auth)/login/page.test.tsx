import React from "react";
import { it, expect, describe, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "../../../../src/app/(auth)/login/page";

describe("login page", () => {
  beforeEach(() => {
    render(<Page />);
  });

  afterEach(() => {
    global.innerWidth = 1024;
    window.dispatchEvent(new Event("resize"));
  });

  it("should render the main heading", () => {
    const heading = screen.getByRole("heading", { name: /Decibel Tribe/i });
    expect(heading).toBeInTheDocument();
  });

  it("should render Google Sign-In Button", () => {
    const googleButton = screen.getByRole("link", {
      name: /Use Google/i,
    });
    expect(googleButton).toBeInTheDocument();
  });

  it("should render the login image", () => {
    const image = screen.getByAltText("");
    expect(image).toBeInTheDocument();
  });

  it("should render the sign-up link", () => {
    const signUpLink = screen.getByRole("link", {
      name: /Don't have an account\? Sign up/i,
    });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute("href", "/signup");
  });

  it("should render the forgot password link", () => {
    const forgotPasswordLink = screen.getByRole("link", {
      name: /Forgot Password\?/i,
    });
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-pass");
  });

  it("should hide the image on smaller screens", () => {
    global.innerWidth = 500;
    window.dispatchEvent(new Event("resize"));

    const image = screen.getByAltText("");

    expect(image).toHaveClass("hidden");
  });

  it("should render the login form", () => {
    const usernameInput = screen.getByLabelText(/Username\/Email/i);
    expect(usernameInput).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    expect(document.body).toMatchSnapshot();
  });
});
