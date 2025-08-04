// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes a Settings/Preferences page exists with notification controls
// Assumes SettingsPage Page Object exists

describe("[NotificationsTeam] Notifications - Update Preferences [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/settings/notifications"); // Assuming route exists
    // Intercept preferences update API
    cy.intercept("PUT", "/api/users/preferences").as("updatePreferences");
  });

  it("should allow user to disable email notifications for new likes", () => {
    // Find the toggle/checkbox for email likes
    // SettingsPage.elements.emailLikesToggle().should('be.checked'); // Assuming default is on
    // SettingsPage.elements.emailLikesToggle().click();
    cy.get('[data-testid="email-likes-toggle"]').click(); // Example

    // Find and click the save preferences button
    // SettingsPage.elements.saveButton().click();
    cy.get('[data-testid="save-preferences-button"]').click(); // Example

    // Wait for API call and assert success
    cy.wait("@updatePreferences");
    cy.contains("Preferences saved").should("be.visible"); // Example success message

    // Optional: Re-visit page and verify toggle state persisted
    cy.visit("/settings/notifications");
    // SettingsPage.elements.emailLikesToggle().should('not.be.checked');
    cy.get('[data-testid="email-likes-toggle"]').should("not.be.checked"); // Example
  });

  // Add tests for other notification types (comments, follows, etc.)
});
