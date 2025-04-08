// Assumes user 'postOwner' created a post (seeded/created)
// Assumes Post Page Object exists

describe("[SocialTeam] Posts - Delete Post [functional]", () => {
  let targetPostId: string;
  const postContent = "Post to be deleted";

  beforeEach(() => {
    // TODO: Seed/create post by postOwner, get postId
    // Example: cy.createPostByApi({ userId: 'postOwner', content: postContent }).then(postId => { targetPostId = postId; });
    // cy.loginByApi("postOwner", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/"); // Visit feed where post is visible (or profile page)

    // Intercept delete post API (assuming DELETE)
    cy.intercept("DELETE", `/api/posts/${targetPostId}`).as("deletePost");
  });

  it("should allow user to delete their own post", () => {
    // Find the specific post
    cy.contains('[data-testid="post-content"]', postContent).within(() => {
      // Open the post options menu
      // PostPage.elements.postOptionsMenuButton().click();
      cy.get('[data-testid="post-options-menu"]').click(); // Example

      // Click the delete post option
      // PostPage.elements.deletePostOption().click();
      cy.get('[data-testid="delete-post-option"]').click(); // Example
    });

    // Confirm deletion if a dialog appears
    // cy.get('[data-testid="confirm-delete-post"]').click();

    // Wait for API call
    cy.wait("@deletePost");

    // Assert the post is removed from the feed/page
    cy.contains('[data-testid="post-content"]', postContent).should(
      "not.exist",
    );
  });
});
