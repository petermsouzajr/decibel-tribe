import "@testing-library/jest-dom/vitest";
// Remove the explicit module declaration - we'll put this in a .d.ts file
/*
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";
import { vi } from "vitest";

declare module "vitest" {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  interface JestAssertion<T = any>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}
*/

// Mock react's cache function globally
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: (<T extends (...args: any[]) => any>(fn: T) =>
      fn) as typeof actual.cache,
  };
});

// Mock next/cache globally to handle unstable_cache errors
vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((cb) => cb), // Simple pass-through mock
}));

// Mock next/headers globally
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name?: string) => {
      // console.log(`Mock cookies().get called with: ${name}`);
      // Return null initially, or adjust if specific tests need a mock cookie
      return undefined;
    }),
    // Add other methods like set, has, delete if needed by your tests
    has: vi.fn(() => false),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  // Mock other exports from next/headers if needed (e.g., headers)
  headers: vi.fn(() => new Map()),
}));

// Mock prisma client globally (adding more methods)
vi.mock("@/lib/prisma", () => ({
  default: {
    // Explicitly make mocked methods vi.fn()
    post: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));
