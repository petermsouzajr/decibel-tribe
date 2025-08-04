// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes UpdatePasswordDialog Page Object exists
import { generatePassword } from "../../../factories/passwordData"; // Assuming a password factory

describe("[AuthTeam] User Profile - Update Password Success [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/profile/testuser");
    // Intercept update password API
    cy.intercept("PUT", "/api/users/update-password").as("updatePassword");
  });

  it("should allow user to successfully update their password", () => {
    const currentPassword = Cypress.env("password");
    const newPassword = generatePassword();

    // Open the update password dialog
    cy.get('[data-testid="update-password-button"]').click(); // Example

    // Use UpdatePasswordDialog Page Object
    // UpdatePasswordDialog.fillForm({ currentPassword, newPassword, confirmPassword: newPassword });
    // UpdatePasswordDialog.submit();
    cy.get('[data-testid="current-password-input"]').type(currentPassword); // Example
    cy.get('[data-testid="new-password-input"]').type(newPassword); // Example
    cy.get('[data-testid="confirm-password-input"]').type(newPassword); // Example
    cy.get('[data-testid="update-password-submit"]').click(); // Example

    // Wait for API call and assert dialog closes
    cy.wait("@updatePassword");
    cy.get('[role="dialog"]').should("not.exist");

    // Optional: Attempt to login with the new password (requires logout first)
    cy.logoutByApi();
    // cy.loginByApi("testuser", newPassword); // Should succeed
    cy.loginViaUi();
    cy.visit("/");
    cy.get('[data-testid="user-avatar"]').should("be.visible"); // Verify login worked

    // TODO: Consider how to reset the password back to the original env password after the test
  });
});
