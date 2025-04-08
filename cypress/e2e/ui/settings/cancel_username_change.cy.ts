// Assumes logged-in user 'testuser' exists
// Assumes Account Settings page exists

describe.skip("[AuthTeam] Settings - Cancel Username Change [functional]", () => {
  const testUsername = "testUser2@test.com"; // Define username for login/visit

  beforeEach(() => {
    // cy.loginByApi(testUsername, Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/users/${testUsername}`); // Visit user profile page
  });

  it("should not update username if change is cancelled", () => {
    // Enter a new username
    cy.get('[data-testid="username-input"]').clear().type("NewUsernameAttempt");

    // Click a cancel button (if one exists separate from main save)
    // SettingsPage.elements.cancelUsernameChangeButton().click();
    cy.get('[data-testid="cancel-username-button"]').click(); // Example

    // Assert input is possibly cleared or reset, or simply navigate away
    // cy.get('[data-testid="username-input"]').should('have.value', testUsername);

    // Re-visit or check profile to ensure username hasn't changed
    cy.visit(`/users/${testUsername}`); // Re-visit the logged-in user's profile
    cy.get('[data-testid="profile-username"]').should(
      "contain",
      testUsername, // Check against the logged-in username
    );
  });
});
