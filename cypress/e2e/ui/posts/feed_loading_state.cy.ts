// Assumes logged-in user (use cy.loginByApi)

describe("[SocialTeam] Posts - Feed Loading State [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    // Intercept feed API but delay the response
    cy.intercept("GET", "/api/posts/for-you?*", (req) => {
      return Cypress.Promise.delay(1000).then(() => req.continue()); // Delay 1 second
    }).as("getFeedDelayed");
  });

  it("should display loading skeletons while feed is loading", () => {
    cy.visit("/");

    // Assert loading skeletons are visible initially
    // HomePage.elements.postLoadingSkeleton().should('be.visible').and('have.length.gt', 0);
    cy.get('[data-testid="post-skeleton"]').should("be.visible"); // Example
    cy.get('[data-testid="post-content"]').should("not.exist"); // Real content not yet loaded

    // Wait for the delayed response
    cy.wait("@getFeedDelayed");

    // Assert loading skeletons are gone
    cy.get('[data-testid="post-skeleton"]').should("not.exist");

    // Assert actual post content is now visible
    cy.get('[data-testid="post-content"]').should("be.visible");
  });
});
