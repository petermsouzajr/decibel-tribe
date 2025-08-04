// Assumes user 'commentOwner' commented on a post (seeded/created)
// Assumes Post Page Object exists

describe("[SocialTeam] Posts - Delete Comment [functional]", () => {
  let targetPostId: string;
  let commentId: string;
  const commentText = "Comment to be deleted";

  beforeEach(() => {
    // TODO: Seed/create post, then comment by commentOwner, get commentId
    // Example: cy.createPostByApi(...).then(postId => { targetPostId = postId; cy.commentOnPostByApi(targetPostId, 'commentOwner', commentText).then(cId => commentId = cId); });
    // cy.loginByApi("commentOwner", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/posts/${targetPostId}`); // Visit post detail page

    // Intercept delete comment API (assuming DELETE)
    cy.intercept(
      "DELETE",
      `/api/posts/${targetPostId}/comments/${commentId}`,
    ).as("deleteComment");
  });

  it("should allow user to delete their own comment", () => {
    // Find the specific comment
    // PostPage.elements.commentItem(commentId).within(() => {
    cy.contains('[data-testid="comment-text"]', commentText).within(() => {
      // Example locator
      // Click the delete button/icon for the comment
      // PostPage.elements.deleteCommentButton().click();
      cy.get('[data-testid="delete-comment-button"]').click(); // Example
    });

    // Confirm deletion if a dialog appears
    // cy.get('[data-testid="confirm-delete-comment"]').click();

    // Wait for API call
    cy.wait("@deleteComment");

    // Assert the comment is removed from the post
    cy.contains('[data-testid="comment-text"]', commentText).should(
      "not.exist",
    );
  });
});
