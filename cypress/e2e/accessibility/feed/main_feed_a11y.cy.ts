// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Requires cypress-axe package installation and setup in support/commands.ts

describe.skip("[SocialTeam] Accessibility - Main Feed/Dashboard [sanity]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/");
    // Ensure page content is loaded before injecting axe
    cy.get('[data-testid="post-content"]').should("exist"); // Example wait condition
    cy.injectAxe();
  });

  it("should have no detectable accessibility violations on page load", () => {
    // Basic check with default options
    cy.checkA11y();
  });

  it("should have no detectable WCAG AA violations", () => {
    // Check against specific standards
    cy.checkA11y(null, { runOnly: { type: "tag", values: ["wcag2aa"] } });
  });

  // Add tests checking specific components after interactions if needed
});
