// Assumes logged-in user with dating profile
// Assumes NO potential matches exist based on preferences/existing swipes

describe.skip("[SocialTeam] Dating - Empty Deck State [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("datingUser", Cypress.env("password"));
    // TODO: Ensure user has dating profile, and NO potential matches available in DB
    cy.visit("/dating/deck");
  });

  it("should display an empty state message when no more profiles are available", () => {
    // Assert no profile cards are visible
    cy.get('[data-testid="match-profile-card"]').should("not.exist");

    // Assert empty state message is shown
    cy.contains("No more profiles").should("be.visible"); // Example
    cy.contains("Try adjusting your preferences").should("be.visible"); // Example
  });
});
