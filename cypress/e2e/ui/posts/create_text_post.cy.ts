// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes Page Objects for HomePage and PostEditor exist

describe("[SocialTeam] Posts - Create Text Post [smoke]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/"); // Or navigate to where the post editor is accessible
  });

  it("should allow user to create a text-only post", () => {
    const postText = "This is a new text post from Cypress!";

    // Open post editor if necessary
    // HomePage.elements.createPostButton().click();

    // Use PostEditor Page Object
    // PostEditorPage.fillPostText(postText);
    // PostEditorPage.submitPost();
    cy.get('[data-testid="post-editor-input"]').type(postText); // Example
    cy.get('[data-testid="post-editor-submit"]').click(); // Example

    // Assert post appears in the feed
    cy.contains('[data-testid="post-content"]', postText).should("be.visible"); // Example

    // Optional: Navigate to user profile and verify post appears there
    // cy.visit('/profile/testuser');
    // cy.contains('[data-testid="post-content"]', postText).should('be.visible');
  });

  it("should not allow submitting an empty post", () => {
    // Open post editor if necessary
    // Attempt to submit empty post
    // PostEditorPage.submitPost();
    cy.get('[data-testid="post-editor-submit"]').click(); // Example

    // Assert submit button might be disabled OR an error message appears
    // cy.get('[data-testid="post-editor-submit"]').should('be.disabled');
    // cy.contains('Post cannot be empty').should('be.visible');
  });
});
