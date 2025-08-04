// Assumes user 'blockerUser' has blocked 'userToUnblock' (seeded/created)
// Assumes UserProfilePage Page Object exists

describe("[AuthTeam] User Profile - Unblock User [functional]", () => {
  const userToUnblock = "userToUnblock";

  beforeEach(() => {
    // TODO: Ensure blockerUser exists and HAS BLOCKED userToUnblock
    // Example: cy.blockUserByApi('blockerUser', userToUnblock);
    // cy.loginByApi("blockerUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/users/${userToUnblock}`); // Visit the blocked user's profile
    // Intercept unblock user API
    cy.intercept("DELETE", `/api/users/${userToUnblock}/block`).as(
      "unblockUser",
    ); // Adjust endpoint if needed
  });

  it("should allow a user to unblock a previously blocked user", () => {
    // Find unblock button (either directly visible or in options menu)
    // UserProfilePage.elements.optionsMenuButton().click();
    // UserProfilePage.elements.unblockUserOption().click();
    cy.get('[data-testid="profile-options-menu"]').click(); // Example
    cy.get('[data-testid="unblock-user-option"]').click(); // Example

    // Confirm unblocking if needed
    // cy.get('[data-testid="confirm-unblock-user"]').click();

    cy.wait("@unblockUser");

    // Assert UI changes back to normal state (Block button visible, content shown)
    cy.get('[data-testid="profile-options-menu"]').click(); // Re-open menu
    cy.get('[data-testid="block-user-option"]').should("be.visible");
    // Optional: Verify content like posts are now visible again
    cy.visit(`/users/${userToUnblock}`); // Re-visit to reload content
    cy.get('[data-testid="post-feed"]').should("exist"); // Example
  });
});
