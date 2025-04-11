import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event"; // Uncommented
import { PasswordInput } from "@/components/PasswordInput"; // Updated import

describe("[Core][Component] PasswordInput", () => {
  it("should render as password input initially with show button", () => {
    const placeholderText = "Enter password";
    render(<PasswordInput placeholder={placeholderText} />);

    const input = screen.getByPlaceholderText(placeholderText);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");

    const showButton = screen.getByTitle("Show password");
    expect(showButton).toBeInTheDocument();
  });

  it("should toggle input type to text when show button is clicked", async () => {
    // Uncommented test implementation
    const user = userEvent.setup();
    render(<PasswordInput placeholder="Enter" />);
    const input = screen.getByPlaceholderText("Enter");
    const showButton = screen.getByTitle("Show password");
    await act(async () => {
      await user.click(showButton);
    });
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByTitle("Hide password")).toBeInTheDocument();
  });

  it("should toggle input type back to password when clicked again", async () => {
    // Uncommented test implementation
    const user = userEvent.setup();
    render(<PasswordInput placeholder="Enter" />);
    const showButton = screen.getByTitle("Show password");
    await act(async () => {
      await user.click(showButton); // Click once to show
    });
    const hideButton = screen.getByTitle("Hide password");
    await act(async () => {
      await user.click(hideButton); // Click again to hide
    });
    const input = screen.getByPlaceholderText("Enter");
    expect(input).toHaveAttribute("type", "password");
    expect(screen.getByTitle("Show password")).toBeInTheDocument();
  });

  it("should forward ref to the input element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<PasswordInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("should pass other props like placeholder, name, id to the input", () => {
    const placeholderText = "pwd";
    const name = "passwordField";
    const id = "pwd-id";
    render(<PasswordInput placeholder={placeholderText} name={name} id={id} />);
    const input = screen.getByPlaceholderText(placeholderText);
    expect(input).toHaveAttribute("name", name);
    expect(input).toHaveAttribute("id", id);
  });
});
