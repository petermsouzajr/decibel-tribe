import Page from "@/app/(main)/groups/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Groups Page Integration Test", () => {
  const queryClient = new QueryClient();

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    );
  it("renders the Groups header", () => {
    renderComponent();

    const heading = screen.getByRole("heading", { name: /Groups/i });
    expect(heading).toBeInTheDocument();
  });

  it("renders the New Group button", () => {
    renderComponent();

    const newGroupButton = screen.getByRole("button", { name: /New Group/i });
    expect(newGroupButton).toBeInTheDocument();
  });
});
