// Assumes logged-in user (use cy.loginByApi)

describe("[SocialTeam] Search - Empty State [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/search");
  });

  it("should display an initial empty/prompt state before searching", () => {
    // Assert search results sections are empty or show prompts
    cy.get('[data-testid="search-results-posts"]').should(
      "not.contain",
      '[data-testid="post-content"]',
    );
    cy.get('[data-testid="search-results-users"]').should(
      "not.contain",
      '[data-testid="user-list-item"]',
    );
    cy.get('[data-testid="search-results-events"]').should(
      "not.contain",
      '[data-testid="event-list-item"]',
    );

    // Assert prompt message is visible
    cy.contains("Search for posts, users, or events").should("be.visible"); // Example prompt
  });
});
