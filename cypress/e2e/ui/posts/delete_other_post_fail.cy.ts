// Assumes logged-in user 'viewerUser' exists
// Assumes post 'otherUserPost' exists, created by 'postOwner'
// Assumes viewerUser is NOT postOwner

describe("[SocialTeam] Posts - Delete Other User Post Fail [functional]", () => {
  let targetPostId: string;
  const postContent = "Cannot delete this post";

  beforeEach(() => {
    // TODO: Ensure post exists, owned by postOwner, viewerUser is different
    // Example: cy.createPostByApi({ content: postContent, userId: 'postOwner' }).then(id => targetPostId = id);
    // cy.loginByApi("viewerUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/"); // Visit feed where post might be visible
    // Or cy.visit(`/posts/${targetPostId}`);
  });

  it("should not show delete option for a post created by another user", () => {
    // Find the specific post
    cy.contains('[data-testid="post-content"]', postContent).within(() => {
      // Attempt to open the post options menu
      cy.get('[data-testid="post-options-menu"]').click(); // Example

      // Assert that the "Delete Post" option is NOT present in the menu
      // PostPage.elements.deletePostOption().should('not.exist');
      cy.get('[data-testid="delete-post-option"]').should("not.exist"); // Example
    });
  });
});
