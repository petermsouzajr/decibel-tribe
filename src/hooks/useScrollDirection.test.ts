import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, fireEvent, act } from "@testing-library/react";
// Default import?
import useScrollDirection from "@/hooks/useScrollDirection";

// Helper to simulate scroll
const simulateScroll = (y: number) => {
  act(() => {
    // JSDOM doesn't implement scrollY, use pageYOffset as alias if needed, but mocking scrollY directly is cleaner
    Object.defineProperty(window, "scrollY", { value: y, writable: true });
    fireEvent.scroll(window);
  });
};

describe("[Core][Hooks] useScrollDirection", () => {
  let initialScrollY: number;

  beforeEach(() => {
    // Save initial scrollY and reset before each test
    initialScrollY = window.scrollY;
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  afterEach(() => {
    // Restore initial scrollY after each test
    Object.defineProperty(window, "scrollY", {
      value: initialScrollY,
      writable: true,
    });
  });

  it("should initialize with 'down' direction", () => {
    const { result } = renderHook(() => useScrollDirection());
    expect(result.current).toBe("down");
  });

  it("should remain 'down' when scrolling down", () => {
    const { result } = renderHook(() => useScrollDirection());
    expect(result.current).toBe("down"); // Initial state

    simulateScroll(100); // Scroll down significantly
    expect(result.current).toBe("down"); // Should remain 'down'
  });

  it("should switch to 'up' when scrolling up significantly", () => {
    const { result } = renderHook(() => useScrollDirection());
    simulateScroll(200); // Establish a scrolled down position
    expect(result.current).toBe("down");

    simulateScroll(100); // Scroll up significantly
    expect(result.current).toBe("up");
  });

  it("should switch back to 'down' when scrolling down significantly after scrolling up", () => {
    const { result } = renderHook(() => useScrollDirection());
    simulateScroll(200); // Scroll down
    simulateScroll(100); // Scroll up -> direction 'up'
    expect(result.current).toBe("up");

    simulateScroll(200); // Scroll down again
    expect(result.current).toBe("down");
  });

  it("should not change direction for small scrolls down (within threshold)", () => {
    const { result } = renderHook(() => useScrollDirection());
    // Go up first to change state away from initial 'down'
    simulateScroll(200);
    simulateScroll(100);
    expect(result.current).toBe("up");

    simulateScroll(105); // Small scroll down
    expect(result.current).toBe("up"); // Should remain 'up'
  });

  it("should not change direction for small scrolls up (within threshold)", () => {
    const { result } = renderHook(() => useScrollDirection());
    simulateScroll(100); // Establish 'down' state
    expect(result.current).toBe("down");

    simulateScroll(95); // Small scroll up
    expect(result.current).toBe("down"); // Should remain 'down'
  });

  // TODO: [Core] Test cleanup logic (event listener removal) if possible/necessary.
});
