// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes enough posts exist (>= 1 page + 1) to trigger infinite scroll (seeded/created)

describe("[SocialTeam] Posts - Infinite Scroll [functional]", () => {
  const initialPostCount = 10; // Assuming page size is 10
  const postPrefix = "Infinite scroll post #";

  beforeEach(() => {
    // TODO: Create > initialPostCount posts via API
    // Example: Loop to call cy.createPostByApi({ content: `${postPrefix}${i}` });
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/"); // Visit main feed

    // Intercept the feed API
    cy.intercept("GET", "/api/posts/for-you?*").as("getFeedPage"); // Adjust endpoint as needed
  });

  it("should load more posts when scrolling to the bottom of the feed", () => {
    // Wait for initial posts to load
    cy.wait("@getFeedPage");
    cy.get('[data-testid="post-content"]').should(
      "have.length.at.least",
      initialPostCount,
    );

    // Find the last post initially loaded
    cy.get('[data-testid="post-content"]').last().as("lastInitialPost");

    // Scroll to the bottom of the page
    cy.scrollTo("bottom");

    // Wait for the next page request/response
    cy.wait("@getFeedPage");

    // Assert that more posts are now visible
    cy.get('[data-testid="post-content"]').should(
      "have.length.greaterThan",
      initialPostCount,
    );

    // Assert the previously last post is still visible (not replaced)
    cy.get("@lastInitialPost").should("be.visible");
  });
});
