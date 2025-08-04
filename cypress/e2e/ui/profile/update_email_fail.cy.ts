// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes UpdateEmailDialog Page Object exists

describe("[AuthTeam] User Profile - Update Email Fail [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/profile/testuser");
    // Intercept update email API
    cy.intercept("PUT", "/api/users/update-email").as("updateEmail");
  });

  it("should show an error when attempting to update email with incorrect password", () => {
    const newEmail = "new.email@example.com";
    const incorrectPassword = "wrongPassword123";

    // Open the update email dialog (assuming button exists on profile page)
    cy.get('[data-testid="update-email-button"]').click(); // Example

    // Use UpdateEmailDialog Page Object
    // UpdateEmailDialog.fillForm({ newEmail, password: incorrectPassword });
    // UpdateEmailDialog.submit();
    cy.get('[data-testid="new-email-input"]').type(newEmail); // Example
    cy.get('[data-testid="current-password-input"]').type(incorrectPassword); // Example
    cy.get('[data-testid="update-email-submit"]').click(); // Example

    // Wait for API call and assert error message is visible within the dialog
    cy.wait("@updateEmail");
    // UpdateEmailDialog.elements.errorMessage().should('be.visible').and('contain', 'Incorrect password');
    cy.get('[role="dialog"]').within(() => {
      cy.get('[data-testid="error-message"]').should("be.visible"); // Example
    });

    // Assert dialog is still open
    cy.get('[role="dialog"]').should("be.visible");
  });
});
