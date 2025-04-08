// Assumes logged-in user with completed dating profile (use cy.loginByApi)
// Assumes potential matches exist in the database
// Assumes MatchDeck Page Object exists

describe.skip("[SocialTeam] Dating - Swiping Deck [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("datingUser", Cypress.env("password"));
    // TODO: Ensure dating profile exists, ensure potential matches exist
    cy.visit("/dating/deck"); // Assuming route for the match deck
    // Intercept swipe actions API
    cy.intercept("POST", "/api/dating/swipe").as("swipeAction");
  });

  it('should allow user to swipe "Yes" on a profile', () => {
    // Get current visible profile card
    // MatchDeckPage.elements.currentProfileCard().as('currentCard');
    cy.get('[data-testid="match-profile-card"]').first().as("currentCard"); // Example

    // Click the "Yes" button
    // MatchDeckPage.elements.swipeYesButton().click();
    cy.get('[data-testid="swipe-yes-button"]').click(); // Example

    // Wait for API call
    cy.wait("@swipeAction").its("request.body.liked").should("eq", true); // Check payload

    // Assert the swiped card disappears and a new one appears (or end-of-deck message)
    cy.get("@currentCard").should("not.exist");
    cy.get('[data-testid="match-profile-card"]').should("exist"); // Or check for end-of-deck
  });

  it('should allow user to swipe "No" on a profile', () => {
    cy.get('[data-testid="match-profile-card"]').first().as("currentCard");

    // Click the "No" button
    // MatchDeckPage.elements.swipeNoButton().click();
    cy.get('[data-testid="swipe-no-button"]').click(); // Example

    cy.wait("@swipeAction").its("request.body.liked").should("eq", false);

    cy.get("@currentCard").should("not.exist");
    cy.get('[data-testid="match-profile-card"]').should("exist"); // Or check for end-of-deck
  });
});
