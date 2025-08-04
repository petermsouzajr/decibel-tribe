// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes SearchPage Page Object exists

describe("[SocialTeam] Search - No Results [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/search");
    // Intercept search API
    cy.intercept("GET", "/api/search?*").as("searchRequest");
  });

  it('should display a "no results" message when search yields no matches', () => {
    const searchTerm = "nonExistentTermXyz123";

    // Use SearchPage Page Object
    // SearchPage.performSearch(searchTerm);
    cy.get('[data-testid="search-input"]').type(`${searchTerm}{enter}`); // Example

    cy.wait("@searchRequest");

    // Assert "no results" message is shown in relevant tabs
    // SearchPage.elements.postsTabNoResults().should('be.visible');
    // SearchPage.elements.usersTabNoResults().should('be.visible');
    // SearchPage.elements.eventsTabNoResults().should('be.visible');
    cy.get('[data-testid="search-results-posts"]')
      .contains("No posts found")
      .should("be.visible"); // Example
    cy.get('[data-testid="search-results-users"]')
      .contains("No users found")
      .should("be.visible"); // Example
    cy.get('[data-testid="search-results-events"]')
      .contains("No events found")
      .should("be.visible"); // Example
  });
});
