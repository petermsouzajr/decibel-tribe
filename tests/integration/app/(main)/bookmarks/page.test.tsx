import { render, screen } from "@testing-library/react";
import Page from "@/app/(main)/bookmarks/page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";

vi.mock("@/lib/ky", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("Bookmarks Page", () => {
  let queryClient: QueryClient;

  const renderPage = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>,
    );

  beforeEach(() => {
    queryClient = new QueryClient();

    // @ts-ignore
    kyInstance.get.mockImplementation(() => ({
      json: () =>
        Promise.resolve({
          posts: [],
          nextCursor: null,
        }),
    }));
  });

  it("should render the Bookmarks component as part of the page", () => {
    renderPage();

    const bookmarksHeading = screen.getByRole("heading", {
      name: /Bookmarks/i,
    });
    expect(bookmarksHeading).toBeInTheDocument;
  });

  it("should display a message when there are no bookmarks", async () => {
    renderPage();

    const message = await screen.findByText(
      "You don't have any bookmarks yet.",
    );
    expect(message).toBeInTheDocument();
  });

  it("should match snapshot", () => {
    renderPage();
    expect(document.body).toMatchSnapshot();
  });
});
