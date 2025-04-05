import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
// import userEvent from '@testing-library/user-event'; // Skipped for now
import { PasswordInput } from "./PasswordInput"; // Use named import

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

  it.skip("should toggle input type to text when show button is clicked", async () => {
    // Requires user-event
    // render(<PasswordInput placeholder="Enter" />);
    // const input = screen.getByPlaceholderText('Enter');
    // const showButton = screen.getByTitle('Show password');
    // await userEvent.click(showButton);
    // expect(input).toHaveAttribute('type', 'text');
    // expect(screen.getByTitle('Hide password')).toBeInTheDocument();
  });

  it.skip("should toggle input type back to password when clicked again", async () => {
    // Requires user-event
    // render(<PasswordInput placeholder="Enter" />);
    // const showButton = screen.getByTitle('Show password');
    // await userEvent.click(showButton); // Click once to show
    // const hideButton = screen.getByTitle('Hide password');
    // await userEvent.click(hideButton); // Click again to hide
    // const input = screen.getByPlaceholderText('Enter');
    // expect(input).toHaveAttribute('type', 'password');
    // expect(screen.getByTitle('Show password')).toBeInTheDocument();
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
