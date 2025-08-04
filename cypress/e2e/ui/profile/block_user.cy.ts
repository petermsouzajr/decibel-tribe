// Assumes users 'blockerUser' and 'userToBlock' exist
// Assumes UserProfilePage Page Object exists with block functionality

describe("[SocialTeam] User Profile - Block User [functional]", () => {
  const userToBlock = "userToBlock";

  beforeEach(() => {
    // cy.loginByApi("blockerUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/users/${userToBlock}`);
    // Intercept block user API
    cy.intercept("POST", `/api/users/${userToBlock}/block`).as("blockUser"); // Adjust endpoint if needed
  });

  it("should allow a user to block another user from their profile page", () => {
    // Find block button (likely in a profile options menu)
    // UserProfilePage.elements.optionsMenuButton().click();
    // UserProfilePage.elements.blockUserOption().click();
    cy.get('[data-testid="profile-options-menu"]').click(); // Example
    cy.get('[data-testid="block-user-option"]').click(); // Example

    // Confirm blocking if a dialog appears
    // cy.get('[data-testid="confirm-block-user"]').click();

    // Wait for API call
    cy.wait("@blockUser");

    // Assert UI changes (e.g., button text changes to "Unblock", content hidden)
    cy.get('[data-testid="profile-options-menu"]').click(); // Re-open menu
    cy.get('[data-testid="unblock-user-option"]').should("be.visible"); // Example check
    // Optional: Verify content like posts are no longer visible
    // cy.get('[data-testid="post-feed"]').should('not.exist');
  });

  it("should prevent blocked user from viewing blocker profile", () => {
    // Block the user first via API for setup efficiency
    // cy.blockUserByApi(userToBlock);
    cy.logoutByApi();
    // cy.loginByApi(userToBlock, Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/users/blockerUser", { failOnStatusCode: false });

    // Assert restricted access (similar to private profile check)
    cy.contains("You cannot view this profile").should("be.visible"); // Example message
  });
});
