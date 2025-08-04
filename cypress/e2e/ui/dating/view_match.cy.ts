// Assumes logged-in user 'userA' has matched with 'userB' (seeded/created)
// Assumes MatchesPage Page Object exists

describe.skip("[SocialTeam] Dating - View Match [functional]", () => {
  const matchedUsername = "userB";

  beforeEach(() => {
    // TODO: Ensure userA and userB exist and have MUTUALLY liked each other (match exists)
    // cy.loginByApi("userA", Cypress.env("password"));
    cy.visit("/dating/matches"); // Assuming route for matches list
  });

  it("should display a mutual match in the matches list", () => {
    // Assert the matched user appears in the list
    // MatchesPage.elements.matchListItem(matchedUsername).should('be.visible');
    cy.get('[data-testid="match-list-item"]')
      .contains(matchedUsername)
      .should("be.visible"); // Example
  });

  it("should allow navigating to the matched user profile or chat from the matches list", () => {
    // Click on the matched user item
    cy.get('[data-testid="match-list-item"]').contains(matchedUsername).click();

    // Option 1: Assert navigation to chat page with the matched user
    // cy.url().should('include', '/messages');
    // cy.get('[data-testid="chat-header"]').should('contain', matchedUsername);

    // Option 2: Assert navigation to the matched user's profile page
    cy.url().should("include", `/users/${matchedUsername}`);
    cy.get('[data-testid="profile-username"]').should(
      "contain",
      matchedUsername,
    );
  });
});
