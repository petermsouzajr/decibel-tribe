import React from "react";
import { it, expect, beforeEach, describe } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

type PageProps = Record<string, any>;

function customRender(ui: React.ReactElement, options?: any) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    options,
  );
}

export function testNavigation(
  PageComponent: React.ComponentType<any>,
  props?: PageProps,
) {
  describe("Navigation Tests", () => {
    beforeEach(() => {
      customRender(<PageComponent {...props} />);
    });

    it("on larger screens should contain the navigation icons and text", () => {
      global.innerWidth = 1024;
      window.dispatchEvent(new Event("resize"));

      const homeLink = screen.getByTestId("home-link");
      const bookmarkLink = screen.getByTestId("bookmark-link");
      const groupLink = screen.getByTestId("group-link");

      expect(homeLink).toBeInTheDocument();
      expect(bookmarkLink).toBeInTheDocument();
      expect(groupLink).toBeInTheDocument();

      const homeIcon = within(homeLink).getByTestId("icon");
      expect(homeIcon).toBeInTheDocument();
      expect(homeIcon).toContainHTML("<svg");

      const homeText = within(homeLink).getByText(/Home/i);
      expect(homeText).toBeInTheDocument();
    });

    it("on medium screens should contain the navigation icons only", () => {
      global.innerWidth = 768;
      window.dispatchEvent(new Event("resize"));

      const navigation = screen.getByTestId("navigation");
      expect(navigation).toBeInTheDocument();

      const homeText = screen.queryByText(/Home/i);
      expect(homeText).not.toBeInTheDocument();
    });

    it("on smaller screens should hide the navigation icons and text", () => {
      global.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));

      const navigation = screen.getByTestId("navigation");
      expect(navigation).toHaveClass("hidden");
    });

    it("on smaller screens should show the navigation footer", () => {
      global.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));

      const navigationFooter = screen.getByTestId("navigation-footer");
      expect(navigationFooter).toBeInTheDocument();
    });
  });
}

export function testHeader(
  PageComponent: React.ComponentType<any>,
  props?: PageProps,
) {
  describe("Header Tests", () => {
    beforeEach(() => {
      customRender(<PageComponent {...props} />);
    });

    it("on large screens should display the website title in the header", () => {
      global.innerWidth = 1024;
      window.dispatchEvent(new Event("resize"));

      const header = screen.getByRole("header");
      expect(header).toHaveTextContent("Decibel Tribe Stay Human");
    });

    it("on medium screens should display the website title in the header", () => {
      global.innerWidth = 768;
      window.dispatchEvent(new Event("resize"));

      const header = screen.getByTestId("header");
      expect(header).toHaveTextContent("Decibel Tribe");
    });

    it("on smaller screens should display the website title in the header", () => {
      global.innerWidth = 500;
      window.dispatchEvent(new Event("resize"));

      const header = screen.getByTestId("header");
      expect(header).toHaveTextContent("Tribe");
    });

    it("should display the search bar", () => {
      const search = screen.getByTestId("search");
      expect(search).toBeInTheDocument();
    });

    it("should display the user profile", () => {
      const profile = screen.getByTestId("profile");
      expect(profile).toBeInTheDocument();
    });
  });
}

export { customRender };
