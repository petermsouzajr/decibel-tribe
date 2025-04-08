// Assumes logged-in user (use cy.loginByApi)

describe("[SocialTeam] Posts - Special Characters [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/");
    cy.intercept("POST", "/api/posts").as("createPost");
  });

  it("should allow creating and displaying posts with special characters & emoji", () => {
    // Use template literal and escape troublesome characters if needed
    const postContent = `Special chars: <> "' \&*()^%$#@! 😀 emojis ✨`;

    // Create post
    cy.get('[data-testid="post-editor-input"]').type(postContent, {
      parseSpecialCharSequences: false,
    });
    cy.get('[data-testid="post-editor-submit"]').click();
    cy.wait("@createPost");

    // Assert post appears correctly in the feed (escaping might occur, verify render)
    cy.contains('[data-testid="post-content"]', postContent).should(
      "be.visible",
    );
  });
});
