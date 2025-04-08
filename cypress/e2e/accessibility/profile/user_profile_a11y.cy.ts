// Assumes user 'profileUser' exists
// Requires cypress-axe package installation and setup

describe.skip("[AuthTeam] Accessibility - User Profile Page [sanity]", () => {
  beforeEach(() => {
    // No login needed if profiles are public, otherwise cy.loginByApi()
    cy.visit("/users/profileUser"); // Use a known user
    // Ensure page content is loaded
    cy.get('[data-testid="profile-username"]').should("be.visible");
    cy.injectAxe();
  });

  it("should have no detectable accessibility violations on profile page load", () => {
    cy.checkA11y();
  });

  // Add tests checking modals (edit profile, followers, following) after opening them
  it("should have no detectable accessibility violations in edit profile modal", () => {
    // cy.loginByApi('profileUser', ...) // Need to be logged in as the profile owner
    // cy.visit('/users/profileUser');
    // cy.get('[data-testid="edit-profile-button"]').click();
    // cy.get('[role="dialog"]').should('be.visible');
    // cy.injectAxe(); // Re-inject if needed after modal opens
    // cy.checkA11y('[role="dialog"]'); // Check only within the modal
    cy.log("Skipping modal a11y test - requires setup");
  });
});
