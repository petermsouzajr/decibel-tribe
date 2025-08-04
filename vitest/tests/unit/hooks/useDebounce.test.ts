import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useDebounce from "@/hooks/useDebounce";

describe("[Core][Hooks] useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));
    expect(result.current).toBe("initial");
  });

  it("should update value after specified delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 500 },
      },
    );

    rerender({ value: "updated", delay: 500 });
    expect(result.current).toBe("initial"); // Still initial immediately after update

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated"); // Updated after timer advances
  });

  // Test: Value doesn't update before delay
  it("should not update value before the delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } },
    );

    rerender({ value: "updated", delay: 500 });
    expect(result.current).toBe("initial");

    act(() => {
      vi.advanceTimersByTime(499); // Just before the delay expires
    });

    expect(result.current).toBe("initial"); // Should still be initial
  });

  // Test: Multiple updates within delay
  it("should only update to the latest value after delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } },
    );

    // First update
    rerender({ value: "update1", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200); // Advance timers part way
    });
    expect(result.current).toBe("initial"); // Still initial

    // Second update within original delay period
    rerender({ value: "update2", delay: 500 });
    expect(result.current).toBe("initial"); // Still initial immediately after second update

    // Advance timers past the delay initiated by the *second* update
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should now reflect the *last* value set
    expect(result.current).toBe("update2");
  });
});
