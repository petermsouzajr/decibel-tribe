// Assumes logged-in user 'userA' has matched with 'userToUnmatch'
// Assumes MatchesPage Page Object exists

describe.skip("[SocialTeam] Dating - Unmatch User [functional]", () => {
  const userToUnmatch = "userToUnmatch";

  beforeEach(() => {
    // TODO: Ensure match exists between userA and userToUnmatch
    // cy.loginByApi("userA", Cypress.env("password"));
    cy.visit("/dating/matches");
    // Intercept unmatch API
    cy.intercept("DELETE", `/api/dating/matches/${userToUnmatch}`).as(
      "unmatchUser",
    ); // Adjust endpoint
  });

  it("should allow user to unmatch another user from the matches list", () => {
    // Find the match in the list
    cy.contains('[data-testid="match-list-item"]', userToUnmatch).within(() => {
      // Click options/unmatch button
      // MatchesPage.elements.matchOptionsMenu().click();
      // MatchesPage.elements.unmatchOption().click();
      cy.get('[data-testid="match-options-menu"]').click(); // Example
      cy.get('[data-testid="unmatch-user-option"]').click(); // Example
    });

    // Confirm unmatching if dialog appears
    // cy.get('[data-testid="confirm-unmatch"]').click();

    cy.wait("@unmatchUser");

    // Assert the user is removed from the matches list
    cy.contains('[data-testid="match-list-item"]', userToUnmatch).should(
      "not.exist",
    );
  });
});
