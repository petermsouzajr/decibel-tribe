import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

declare module "vitest" {
  // Augments Vitest's Assertion interface with Jest-DOM matchers
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  interface JestAssertion<T = any>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}

  // Augments Vitest's AsymmetricMatchersContaining interface (optional but can help)
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  interface AsymmetricMatchersContaining
    extends TestingLibraryMatchers<any, any> {}
}
