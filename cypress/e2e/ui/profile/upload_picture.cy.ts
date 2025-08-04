// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes EditProfileDialog Page Object exists with avatar upload elements

describe("[MediaTeam] User Profile - Upload Picture [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/profile/testuser");
    // Intercept profile update and uploadthing API
    cy.intercept("PUT", "/api/users/profile").as("updateProfile");
    cy.intercept("POST", "/api/uploadthing").as("uploadAvatar");
  });

  it("should allow user to upload a new profile picture", () => {
    const avatarFixture = "images/test-avatar.jpg"; // Example path in fixtures

    // Open the edit profile dialog
    cy.get('[data-testid="edit-profile-button"]').click();

    // Use EditProfileDialog Page Object
    // EditProfileDialog.elements.avatarUploadInput().selectFile(avatarFixture, { force: true });
    cy.get('input[type="file"][data-testid="avatar-upload"]').selectFile(
      avatarFixture,
      { force: true },
    ); // Example

    // Wait for upload and potentially assert preview/cropper appears
    cy.wait("@uploadAvatar");
    // cy.get('[data-testid="avatar-cropper"]').should('be.visible'); // If using a cropper

    // If cropper exists, interact with it and confirm crop
    // EditProfileDialog.confirmCrop();

    // Submit the profile update
    cy.get('[data-testid="edit-profile-submit"]').click();

    // Wait for profile update and assert dialog closes
    cy.wait("@updateProfile");
    cy.get('[role="dialog"]').should("not.exist");

    // Assert the new avatar is displayed on the profile page
    // UserProfilePage.elements.profileAvatar().should('have.attr', 'src').and('contain', 'new-avatar-url'); // Check src attribute
    cy.get('[data-testid="profile-avatar"] img').should("have.attr", "src"); // Basic check
    // Need a way to verify the SRC is the *new* image URL (might require specific API response handling or checking DB)
  });
});
