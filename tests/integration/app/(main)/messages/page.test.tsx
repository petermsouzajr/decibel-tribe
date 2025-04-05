import { vi } from "vitest";
import kyInstance from "@/lib/ky"; // Need to import it to mock specific methods

// Mock kyInstance specifically for the token endpoint
vi.mock("@/lib/ky", async (importOriginal) => {
  const actualKy = await importOriginal<typeof import("@/lib/ky")>();
  return {
    ...actualKy, // Keep original behavior for other methods/endpoints
    default: {
      ...actualKy.default,
      get: vi
        .fn()
        .mockImplementation(
          async (url: string | URL | Request, options?: any) => {
            if (url === "/api/get-token") {
              console.log("Mocked /api/get-token called");
              // Return a structure that mimics ky response with a mock token
              return {
                json: async () => ({ token: "mock-stream-token" }),
              };
            }
            // For other URLs, use the original implementation (if needed, or just return empty mock)
            // console.log(`Mock kyInstance.get called with non-token URL: ${url}`);
            // return actualKy.default.get(url, options); // Fallback might be complex, let's just return mock for now
            return {
              json: async () => ({}), // Default empty mock for other GETs in this test
            };
          },
        ),
    },
  };
});

import Page from "@/app/(main)/messages/page";
import SessionProvider from "@/app/(main)/SessionProvider";
import { render } from "@testing-library/react";

// Mock the custom hook
vi.mock("./useInitializeChatClient", () => ({
  // Provide a default export which is a function returning null
  default: vi.fn(() => null),
}));

const mockUser: any = {
  id: "1",
  name: "testUser",
};

type SessionContextType = {
  user: any;
  session: any;
  setUser: (user: any) => void;
};

const mockSessionContext: SessionContextType = {
  user: mockUser,
  session: {},
  setUser: () => {},
};

// NOTE: Skipping due to complex mocking required for Stream Chat API calls.
describe("Messages Page", () => {
  const renderPage = () =>
    render(
      <SessionProvider value={mockSessionContext}>
        <Page />
      </SessionProvider>,
    );

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
