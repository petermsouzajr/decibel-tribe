import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock react's cache function globally
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: vi.fn((fn) => fn) as (...args: any[]) => any,
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

// Mock next/navigation globally
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/"), // Default pathname
  redirect: vi.fn((url: string) => {
    console.log(`Mock redirect to: ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("TEST_NOT_FOUND");
  }), // Mock notFound
}));

// Mock UI feedback (toast) globally
const mockToastFn = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToastFn }),
}));
// Export the mock function for use in tests
export { mockToastFn };

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

// --- Remove Mocks added for LikeButton ---

// // Mock server actions - Keep this if other tests might need it globally?
// vi.mock("../src/lib/actions/posts");

// // Mock navigation - Keep this if other tests might need it globally?
// vi.mock("next/navigation", () => ({
//   useRouter: () => ({
//     refresh: vi.fn(),
//   }),
// }));

// // Mock UI feedback (toast) - Keep this if other tests might need it globally?
// vi.mock("sonner", () => ({
//   toast: {
//     error: vi.fn(),
//   },
// }));

// Remove next-auth/react mock
// vi.mock("next-auth/react", () => ({ ... }));

// Remove react-query mock
// const mockGlobalMutate = vi.fn();
// const mockGlobalRefetch = vi.fn();
// vi.mock("@tanstack/react-query", () => ({ ... }));

// Remove exports
// export { mockGlobalMutate, mockGlobalRefetch };

// Runs a cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// --- JSDOM API Mocks ---

// Mock for URL.createObjectURL (needed for image previews/uploads)
if (typeof window !== "undefined" && !URL.createObjectURL) {
  URL.createObjectURL = vi.fn(
    (obj) => `blob:mock/${obj?.type || "unknown"}/${Math.random()}`,
  );
}

// Mock for URL.revokeObjectURL (pair to createObjectURL)
if (typeof window !== "undefined" && !URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}
