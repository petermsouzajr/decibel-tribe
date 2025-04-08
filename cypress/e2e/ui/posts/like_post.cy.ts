// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes a post from another user exists (seeded or created via API in beforeEach)
// Assumes Post Page Object exists

describe("[SocialTeam] Posts - Like Post [functional]", () => {
  let targetPostId: string; // Store ID of the post to interact with

  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    // TODO: Create a post by another user via API or seeding
    // Example: cy.createPostByApi({ userId: 'otherUser', content: 'Post to be liked' }).then(postId => { targetPostId = postId; });
    cy.visit("/"); // Visit the feed where the post is visible

    // Intercept like/dislike API calls
    cy.intercept("POST", "/api/posts/*/likes").as("likeRequest");
    cy.intercept("POST", "/api/posts/*/dislikes").as("dislikeRequest");
  });

  it("should allow user to like a post and see the count update", () => {
    // Find the specific post (using targetPostId or unique content)
    // cy.get(`[data-testid="post-${targetPostId}"]`).within(() => {
    cy.contains('[data-testid="post-content"]', "Post to be liked").within(
      () => {
        // Example locator
        // Optional: Check initial like count
        // PostPage.elements.likeCount().should('contain', '0');

        // Click the like button
        // PostPage.elements.likeButton().click();
        cy.get('[data-testid="like-button"]').click(); // Example

        // Wait for API call and assert UI update
        cy.wait("@likeRequest");
        // PostPage.elements.likeCount().should('contain', '1');
        // PostPage.elements.likeButton().should('have.class', 'active'); // Example active state check
        cy.get('[data-testid="like-count"]').should("contain", "1"); // Example
      },
    );
  });

  it("should allow user to unlike a post previously liked", () => {
    // TODO: Ensure the post is liked first (either via API setup or previous action)
    // Example: cy.likePostByApi(targetPostId)

    // Find the specific post
    cy.contains('[data-testid="post-content"]', "Post to be liked").within(
      () => {
        // Optional: Check initial liked state and count
        // PostPage.elements.likeCount().should('contain', '1');

        // Click the like button again (to unlike)
        cy.get('[data-testid="like-button"]').click();

        // Wait for API call and assert UI update
        cy.wait("@likeRequest"); // Might need a different alias if unlike is a DELETE request
        // PostPage.elements.likeCount().should('contain', '0');
        // PostPage.elements.likeButton().should('not.have.class', 'active');
        cy.get('[data-testid="like-count"]').should("contain", "0"); // Example
      },
    );
  });
});
