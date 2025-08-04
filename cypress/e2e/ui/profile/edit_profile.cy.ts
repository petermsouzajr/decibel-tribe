// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes UserProfilePage and EditProfileDialog Page Objects exist
import { generateProfileData } from "../../../factories/profileData"; // Assuming a profileData factory

describe("[AuthTeam] User Profile - Edit Info [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/profile/testuser"); // Visit own profile page
    // Intercept profile update API
    cy.intercept("PUT", "/api/users/profile").as("updateProfile"); // Adjust API endpoint if different
  });

  it("should allow user to edit display name and bio", () => {
    const profileData = generateProfileData(); // Generate new name/bio

    // Open the edit profile dialog
    // UserProfilePage.elements.editProfileButton().click();
    cy.get('[data-testid="edit-profile-button"]').click(); // Example

    // Use EditProfileDialog Page Object
    // EditProfileDialog.fillForm(profileData);
    // EditProfileDialog.submit();
    cy.get('[data-testid="edit-displayname-input"]')
      .clear()
      .type(profileData.displayName); // Example
    cy.get('[data-testid="edit-bio-textarea"]').clear().type(profileData.bio); // Example
    cy.get('[data-testid="edit-profile-submit"]').click(); // Example

    // Wait for API call and assert dialog closes
    cy.wait("@updateProfile");
    // EditProfileDialog.elements.dialog().should('not.exist');
    cy.get('[role="dialog"]').should("not.exist"); // Example generic dialog check

    // Assert updated information is displayed on the profile page
    // UserProfilePage.elements.displayName().should('contain', profileData.displayName);
    // UserProfilePage.elements.bio().should('contain', profileData.bio);
    cy.get('[data-testid="profile-displayname"]').should(
      "contain",
      profileData.displayName,
    ); // Example
    cy.get('[data-testid="profile-bio"]').should("contain", profileData.bio); // Example
  });

  // Add more tests for validation, cancelling edit, etc.
});
