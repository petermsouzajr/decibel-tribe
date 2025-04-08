// Assumes logged-in user (use cy.loginByApi)
// Assumes EditProfileDialog exists

describe("[AuthTeam] User Profile - Edit Form Cancel [functional]", () => {
  const initialDisplayName = "testuser"; // Assume this is the current name

  beforeEach(() => {
    // cy.loginByApi(initialDisplayName, Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/users/${initialDisplayName}`);
  });

  it("should discard changes when cancelling the edit profile dialog", () => {
    // Open edit dialog
    cy.get('[data-testid="edit-profile-button"]').click();

    // Make changes to inputs
    cy.get('[data-testid="edit-displayname-input"]')
      .clear()
      .type("Temporary Name Change");
    cy.get('[data-testid="edit-bio-textarea"]')
      .clear()
      .type("Temporary bio change");

    // Click the cancel button (or close button)
    // EditProfileDialog.elements.cancelButton().click();
    cy.get('[data-testid="edit-profile-cancel"]').click(); // Example

    // Assert dialog is closed
    cy.get('[role="dialog"]').should("not.exist");

    // Assert original profile info is still displayed (no changes saved)
    cy.get('[data-testid="profile-displayname"]').should(
      "contain",
      initialDisplayName,
    );
    // cy.get('[data-testid="profile-bio"]').should('not.contain', 'Temporary bio change'); // Check original bio if known
  });
});
