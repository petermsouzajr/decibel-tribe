import { vi, afterEach, expect } from "vitest"; // Import vi, afterEach, and expect
import { cleanup } from "@testing-library/react";
import matchers from "@testing-library/jest-dom/matchers";
import "@testing-library/jest-dom/vitest"; // Import Jest-DOM matchers for Vitest

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// --- Date/Time Mocking ---
// Set a fixed date for all tests to ensure consistency in snapshots
// that rely on relative time (e.g., "X seconds ago").
vi.useFakeTimers();
vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

// Optional: Clean up timers after each test if needed, though usually not
// necessary when set globally like this unless specific tests require real timers.
// afterEach(() => {
//   vi.useRealTimers();
// });

// --- JSDOM API Mocks ---
// Add mocks/stubs for missing JSDOM APIs
if (typeof window !== "undefined") {
  // Stub for elementFromPoint (needed by ProseMirror)
  if (!document.elementFromPoint) {
    document.elementFromPoint = vi.fn();
  }

  // Stub for getClientRects (needed by ProseMirror)
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = function () {
      return {
        item: () => null,
        length: 0,
        [Symbol.iterator]: vi.fn(),
      };
    };
  }

  // Stub for getBoundingClientRect (needed by ProseMirror)
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    }));
  }
}
