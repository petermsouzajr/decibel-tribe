// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes a post exists (seeded or created via API in beforeEach)
// Assumes Post Page Object exists with comment elements

describe("[SocialTeam] Posts - Add Comment [functional]", () => {
  let targetPostId: string; // Store ID of the post to interact with

  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    // TODO: Create a post via API or seeding
    // Example: cy.createPostByApi({ userId: 'otherUser', content: 'Post to comment on' }).then(postId => { targetPostId = postId; });
    cy.visit("/"); // Visit the feed or the post's direct page

    cy.intercept("POST", "/api/posts/*/comments").as("postComment");
  });

  it("should allow user to add a comment to a post", () => {
    const commentText = "This is a insightful comment!";

    // Find the specific post
    // cy.get(`[data-testid="post-${targetPostId}"]`).within(() => {
    cy.contains('[data-testid="post-content"]', "Post to comment on").within(
      () => {
        // Example locator
        // Use Post Page Object elements for commenting
        // PostPage.elements.commentInput().type(commentText);
        // PostPage.elements.commentSubmitButton().click();
        cy.get('[data-testid="comment-input"]').type(commentText); // Example
        cy.get('[data-testid="comment-submit"]').click(); // Example
      },
    );

    // Wait for API call
    cy.wait("@postComment");

    // Assert comment appears below the post
    // cy.get(`[data-testid="post-${targetPostId}"]`).within(() => {
    cy.contains('[data-testid="post-content"]', "Post to comment on").within(
      () => {
        cy.contains('[data-testid="comment-text"]', commentText).should(
          "be.visible",
        ); // Example
      },
    );
  });

  it("should not allow submitting an empty comment", () => {
    // Find the specific post
    cy.contains('[data-testid="post-content"]', "Post to comment on").within(
      () => {
        // Attempt to submit empty comment
        cy.get('[data-testid="comment-submit"]').click();

        // Assert submit button is disabled or error appears
        // cy.get('[data-testid="comment-submit"]').should('be.disabled');
        // cy.contains('Comment cannot be empty').should('be.visible');
      },
    );
  });
});
