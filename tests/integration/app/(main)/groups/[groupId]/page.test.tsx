import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import GroupPage from "@/app/(main)/groups/[groupId]/page";

describe("GroupPage Component", () => {
  const queryClient = new QueryClient();
  const mockGroupId = "mock-group-id";

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <GroupPage params={{ groupId: mockGroupId }} />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays loading text when group data is loading", () => {
    renderComponent();

    const loadingText = screen.getByText("Loading group...");
    expect(loadingText).toBeInTheDocument();
  });
});
