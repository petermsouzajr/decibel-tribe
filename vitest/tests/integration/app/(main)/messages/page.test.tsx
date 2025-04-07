import { vi } from "vitest";
import kyInstance from "@/lib/ky"; // Import original instance for reference if needed, but mock replaces it

// Revert to the mock structure that mimics Fetch Response with .json()
vi.mock("@/lib/ky", async (importOriginal) => {
  const actualKy = await importOriginal<typeof import("@/lib/ky")>();

  // Define the mock response object structure expected by Stream Chat tokenProvider
  const mockTokenResponse = {
    ok: true, // Add ok status for more realistic Response mock
    status: 200,
    json: async () => ({ token: "mock-stream-token" }),
  };
  const mockEmptyResponse = {
    ok: true,
    status: 200,
    json: async () => ({}), // For other calls
  };

  return {
    ...actualKy, // Preserve other named exports from the module if any
    default: {
      // Mock the default export (kyInstance)
      ...actualKy.default,
      get: vi
        .fn()
        .mockImplementation(
          async (url: string | URL | Request, options?: any) => {
            if (String(url).includes("/api/get-token")) {
              console.log("Mocked /api/get-token called (Response-like)");
              // Return a Promise resolving to the object with .json()
              return Promise.resolve(mockTokenResponse);
            }
            console.warn(`Unexpected ky.get call in test: ${url}`);
            return Promise.resolve(mockEmptyResponse); // For other calls
          },
        ),
      // Add mocks for other methods (post, put, delete) if needed
    },
  };
});

import Page from "@/app/(main)/messages/page";
import SessionProvider from "@/app/(main)/SessionProvider";
import { render } from "@testing-library/react";

// Mock the custom hook
vi.mock("./useInitializeChatClient", () => ({
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
