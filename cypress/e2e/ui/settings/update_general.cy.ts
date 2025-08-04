// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes a General Settings page exists
// Assumes SettingsPage Page Object exists

describe.skip("[AuthTeam] Settings - Update General [functional]", () => {
  const testUsername = "testUser2@test.com"; // Define username

  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/users/${testUsername}`); // Visit user profile page
    cy.intercept("PUT", "/api/users/settings").as("updateSettings"); // Adjust endpoint if needed
  });

  it("should allow user to update general settings (e.g., timezone)", () => {
    const newTimezone = "America/New_York";

    // Select new timezone
    // SettingsPage.elements.timezoneSelect().select(newTimezone);
    cy.get('[data-testid="timezone-select"]').select(newTimezone); // Example

    // Save changes
    cy.get('[data-testid="save-settings-button"]').click();

    cy.wait("@updateSettings");
    cy.contains("Settings saved").should("be.visible");

    // Re-visit and verify setting persisted
    cy.visit(`/users/${testUsername}`); // Visit user profile page again
    // SettingsPage.elements.timezoneSelect().should('have.value', newTimezone);
    cy.get('[data-testid="timezone-select"]').should("have.value", newTimezone);
  });

  // Add tests for other general settings like language if applicable
});
