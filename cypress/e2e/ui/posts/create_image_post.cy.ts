// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes Page Objects for PostEditor exist

describe("[SocialTeam] Posts - Create Image Post [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/"); // Or navigate to where the post editor is accessible
    // Intercept uploadthing API if needed for stable testing
    cy.intercept("POST", "/api/uploadthing").as("uploadImage");
  });

  it("should allow user to create a post with an image upload", () => {
    const postText = "Check out this image!";
    const imageFixture = "images/test-image.png"; // Example path in fixtures

    // Open post editor if necessary
    // HomePage.elements.createPostButton().click();

    // Use PostEditor Page Object
    // PostEditorPage.fillPostText(postText);
    // PostEditorPage.elements.imageUploadInput().selectFile(imageFixture, { force: true });
    cy.get('[data-testid="post-editor-input"]').type(postText); // Example
    cy.get('input[type="file"][data-testid="image-upload"]').selectFile(
      imageFixture,
      { force: true },
    ); // Example

    // Wait for upload and assert preview appears (if applicable)
    cy.wait("@uploadImage");
    // PostEditorPage.elements.imagePreview().should('be.visible');
    cy.get('[data-testid="image-preview"]').should("be.visible"); // Example

    // PostEditorPage.submitPost();
    cy.get('[data-testid="post-editor-submit"]').click(); // Example

    // Assert post appears in the feed with image
    cy.contains('[data-testid="post-content"]', postText).within(() => {
      cy.get('img[data-testid="post-image"]').should("be.visible"); // Example
    });
  });
});
