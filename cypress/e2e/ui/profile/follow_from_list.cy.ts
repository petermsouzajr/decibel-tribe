// Assumes logged-in user 'testuser' views profile of 'listOwner'
// Assumes 'listOwner' follows/is followed by 'targetUser'

describe("[SocialTeam] User Profile - Follow/Unfollow from List [functional]", () => {
  const listOwner = "listOwner";
  const targetUser = "targetUser";

  beforeEach(() => {
    // TODO: Setup relationship (testuser follows targetUser, listOwner follows targetUser)
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/users/${listOwner}`);
  });

  it("should allow following a user from the Following list", () => {
    // TODO: Ensure testuser does NOT follow targetUser, but listOwner DOES
    cy.get('[data-testid="following-link"]').click(); // Open listOwner's Following list

    cy.contains('[data-testid="following-list-item"]', targetUser).within(
      () => {
        cy.get('[data-testid="follow-button"]')
          .should("contain", "Follow")
          .click(); // Should show follow for testuser
        // Add intercept and wait if needed
        cy.get('[data-testid="follow-button"]').should("contain", "Unfollow");
      },
    );
  });

  it("should allow unfollowing a user from the Following list", () => {
    // TODO: Ensure testuser DOES follow targetUser, and listOwner DOES
    cy.get('[data-testid="following-link"]').click();

    cy.contains('[data-testid="following-list-item"]', targetUser).within(
      () => {
        cy.get('[data-testid="follow-button"]')
          .should("contain", "Unfollow")
          .click();
        // Add intercept and wait if needed
        cy.get('[data-testid="follow-button"]').should("contain", "Follow");
      },
    );
  });

  // Add similar tests for the Followers list
});
