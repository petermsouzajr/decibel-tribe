import React from "react"; // Import React
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import useFollowerInfo from "@/hooks/useFollowerInfo";
import kyInstance from "@/lib/ky"; // Import the instance to mock
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FollowerInfo } from "@/lib/types"; // Import type

// Mock the API call
vi.mock("@/lib/ky"); // Mock the whole module

// Create a QueryClient instance for tests
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }, // Disable retries for tests
});

// Re-typed wrapper function using React.createElement
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    children,
  );
};

describe("[Social][Hooks] useFollowerInfo", () => {
  const userId = "user123";
  const initialData: FollowerInfo = { followers: 10, isFollowedByUser: false };

  beforeEach(() => {
    vi.resetAllMocks();
    // Clear query cache before each test
    queryClient.clear();
  });

  it("should return the initial state immediately", () => {
    const { result } = renderHook(() => useFollowerInfo(userId, initialData), {
      wrapper,
    });
    expect(result.current.data).toEqual(initialData);
    expect(result.current.status).toBe("success"); // Status is success because initialData is provided
  });

  it("should fetch and update follower info successfully", async () => {
    const fetchedData: FollowerInfo = { followers: 15, isFollowedByUser: true };
    // Mock the specific get call chain
    const mockGet = vi.fn().mockReturnValue({
      json: vi.fn().mockResolvedValue(fetchedData),
    });
    vi.mocked(kyInstance.get).mockImplementation(mockGet);

    const { result } = renderHook(
      () => useFollowerInfo(userId, initialData), // Still pass initialData
      { wrapper },
    );

    // Assert initial state first
    expect(result.current.data).toEqual(initialData);

    // Manually invalidate the query to trigger a refetch despite staleTime: Infinity
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: ["follower-info", userId],
      });
    });

    // Now wait for the refetch triggered by invalidation to complete and update data
    await waitFor(() => {
      expect(result.current.data).toEqual(fetchedData);
    });

    // Verify final state and mock call
    expect(result.current.status).toBe("success");
    expect(kyInstance.get).toHaveBeenCalledWith(
      `/api/users/${userId}/followers`,
    );
  });

  it("should return an error state if fetching fails", async () => {
    const errorMessage = "API Error";
    // Mock the specific get call chain to reject
    const mockGet = vi.fn().mockReturnValue({
      json: vi.fn().mockRejectedValue(new Error(errorMessage)),
    });
    vi.mocked(kyInstance.get).mockImplementation(mockGet);

    // Render hook WITHOUT initialData to force 'pending' state first
    const { result } = renderHook(
      () => useFollowerInfo(userId, undefined as any), // Cast to bypass TS check for initialData for testing error state
      { wrapper },
    );

    // Expect initial state to be pending
    expect(result.current.status).toBe("pending");

    // Wait for the query to transition to the error state
    await waitFor(() => expect(result.current.status).toBe("error"));

    // Verify final state
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe(errorMessage);
    expect(kyInstance.get).toHaveBeenCalledWith(
      `/api/users/${userId}/followers`,
    );
  });

  // TODO: [Social] Test scenarios with different initial states if relevant.
  // TODO: [Social] Test refetching behavior if specific logic depends on it.
});
