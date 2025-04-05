import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoadingButton from "./LoadingButton"; // Assuming test file is in the same directory

describe("[Core][Component] LoadingButton", () => {
  it("should render children and not be disabled when not loading", () => {
    render(<LoadingButton loading={false}>Click Me</LoadingButton>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(screen.getByText("Click Me")).toBeInTheDocument();
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("should be disabled and show spinner when loading", () => {
    render(<LoadingButton loading={true}>Submitting...</LoadingButton>);

    const button = screen.getByRole("button", { name: /submitting.../i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(screen.getByText("Submitting...")).toBeInTheDocument();
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("should be disabled when disabled prop is true, even if not loading", () => {
    render(
      <LoadingButton loading={false} disabled={true}>
        Disabled
      </LoadingButton>,
    );

    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const customClass = "my-custom-class";
    render(
      <LoadingButton loading={false} className={customClass}>
        Styled
      </LoadingButton>,
    );

    const button = screen.getByRole("button", { name: /styled/i });
    expect(button).toHaveClass(customClass);
  });

  it("should call onClick prop when clicked and not loading/disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <LoadingButton loading={false} disabled={false} onClick={handleClick}>
        Clickable
      </LoadingButton>,
    );

    const button = screen.getByRole("button", { name: /clickable/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick prop when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <LoadingButton loading={false} disabled={true} onClick={handleClick}>
        Cannot Click Disabled
      </LoadingButton>,
    );

    const button = screen.getByRole("button", {
      name: /cannot click disabled/i,
    });
    // Attempt click, though it shouldn't register due to disabled state
    await user.click(button).catch(() => {}); // Catch potential errors if user-event complains

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should not call onClick prop when loading", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <LoadingButton loading={true} disabled={false} onClick={handleClick}>
        Cannot Click Loading
      </LoadingButton>,
    );

    const button = screen.getByRole("button", {
      name: /cannot click loading/i,
    });
    // Attempt click, though it shouldn't register due to disabled state (implied by loading)
    await user.click(button).catch(() => {}); // Catch potential errors if user-event complains

    expect(handleClick).not.toHaveBeenCalled();
  });
});
