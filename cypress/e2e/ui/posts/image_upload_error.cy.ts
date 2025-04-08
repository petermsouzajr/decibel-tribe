// Assumes logged-in user (use cy.loginByApi)

describe("[MediaTeam] Posts - Image Upload Error [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/");
    // Intercept uploadthing API and force an error
    cy.intercept("POST", "/api/uploadthing", {
      statusCode: 500,
      body: { error: "Upload failed!" },
    }).as("uploadImageFail");
  });

  it("should show an error message if image upload fails", () => {
    const imageFixture = "images/test-image.png";

    // Attempt to upload image
    cy.get('input[type="file"][data-testid="image-upload"]').selectFile(
      imageFixture,
      { force: true },
    );

    cy.wait("@uploadImageFail");

    // Assert error message is shown near the upload area or as a toast
    // cy.get('[data-testid="upload-error-message"]').should('contain', 'Upload failed');
    cy.contains("Image upload failed").should("be.visible"); // Example

    // Assert image preview does not appear
    cy.get('[data-testid="image-preview"]').should("not.exist");

    // Assert post submit button might be disabled if upload is required before posting
  });
});
