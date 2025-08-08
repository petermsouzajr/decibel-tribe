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
      return undefined;
    }),
    has: vi.fn(() => false),
    set: vi.fn(),
    delete: vi.fn(),
  })),
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
  usePathname: vi.fn(() => "/"),
  redirect: vi.fn((url: string) => {
    console.log(`Mock redirect to: ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("TEST_NOT_FOUND");
  }),
}));

// Mock UI feedback (toast) globally
const mockToastFn = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToastFn }),
}));
export { mockToastFn };

// Mock prisma client globally (adding more methods)
vi.mock("@/lib/prisma", () => ({
  default: {
    post: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
    },
    report: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Runs a cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// JSDOM API Mocks
if (typeof window !== "undefined" && !URL.createObjectURL) {
  URL.createObjectURL = vi.fn(
    (obj) => `blob:mock/${obj?.type || "unknown"}/${Math.random()}`,
  );
}
if (typeof window !== "undefined" && !URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}
