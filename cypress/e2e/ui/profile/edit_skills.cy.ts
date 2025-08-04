// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes EditProfileDialog Page Object exists with elements for skills/instruments

describe("[AuthTeam] User Profile - Edit Skills/Instruments [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    // TODO: Optionally ensure user has some initial skills/instruments via API
    cy.visit("/profile/testuser");
    cy.intercept("PUT", "/api/users/profile").as("updateProfile");
  });

  it("should allow user to add a new skill/instrument", () => {
    const newSkill = "Guitar";
    // Open edit dialog
    cy.get('[data-testid="edit-profile-button"]').click();

    // Use EditProfileDialog Page Object
    // EditProfileDialog.addSkill(newSkill);
    cy.get('[data-testid="add-skill-input"]').type(newSkill); // Example
    cy.get('[data-testid="add-skill-button"]').click(); // Example
    cy.get('[data-testid="skill-tag"]').contains(newSkill).should("be.visible"); // Verify tag added in dialog

    // Submit the profile update
    cy.get('[data-testid="edit-profile-submit"]').click();
    cy.wait("@updateProfile");
    cy.get('[role="dialog"]').should("not.exist");

    // Assert skill is displayed on the profile page
    // UserProfilePage.elements.skillTag(newSkill).should('be.visible');
    cy.get('[data-testid="profile-skills-list"]')
      .contains(newSkill)
      .should("be.visible"); // Example
  });

  it("should allow user to remove an existing skill/instrument", () => {
    const skillToRemove = "Drums";
    // TODO: Ensure user HAS skillToRemove initially via API

    cy.visit("/profile/testuser"); // Re-visit to ensure state
    cy.get('[data-testid="edit-profile-button"]').click();

    // Use EditProfileDialog Page Object
    // EditProfileDialog.removeSkill(skillToRemove);
    cy.get('[data-testid="skill-tag"]')
      .contains(skillToRemove)
      .within(() => {
        cy.get('[data-testid="remove-skill-button"]').click(); // Example remove button within tag
      });
    cy.get('[data-testid="skill-tag"]')
      .contains(skillToRemove)
      .should("not.exist"); // Verify tag removed in dialog

    cy.get('[data-testid="edit-profile-submit"]').click();
    cy.wait("@updateProfile");

    // Assert skill is removed from the profile page
    cy.get('[data-testid="profile-skills-list"]')
      .contains(skillToRemove)
      .should("not.exist");
  });
});
