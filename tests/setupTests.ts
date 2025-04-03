import "@testing-library/jest-dom/vitest";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";
import { vi } from "vitest";

// Augment Vitest's expect interface with jest-dom matchers
declare module "vitest" {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  interface JestAssertion<T = any>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

// Mock react's cache function globally
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: (<T extends (...args: any[]) => any>(fn: T) =>
      fn) as typeof actual.cache,
  };
});
