// Assumes logged-in user 'testuser' exists
// Assumes user 'existingUser' also exists
// Assumes an Account Settings page exists

describe.skip("[AuthTeam] Settings - Change Username Fail (Duplicate) [functional]", () => {
  const existingUsername = "existingUser";
  const testUsername = "testUser2@test.com"; // Define username for login/visit

  beforeEach(() => {
    // TODO: Ensure both testuser and existingUser exist
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/users/${testUsername}`); // Visit user profile page
    cy.intercept("PUT", "/api/users/username").as("updateUsername"); // Adjust endpoint if needed
  });

  it("should show an error when trying to change username to one already taken", () => {
    // Enter existing username in the input field
    // SettingsPage.elements.usernameInput().clear().type(existingUsername);
    cy.get('[data-testid="username-input"]').clear().type(existingUsername); // Example

    // Click save/update username button
    // SettingsPage.elements.saveUsernameButton().click();
    cy.get('[data-testid="save-username-button"]').click(); // Example

    // Wait for API response
    cy.wait("@updateUsername");

    // Assert error message is displayed
    // SettingsPage.elements.usernameError().should('contain', 'Username already taken');
    cy.contains("Username already taken").should("be.visible"); // Example

    // Assert input field still shows the attempted (existing) username
    cy.get('[data-testid="username-input"]').should(
      "have.value",
      existingUsername,
    );
  });
});
