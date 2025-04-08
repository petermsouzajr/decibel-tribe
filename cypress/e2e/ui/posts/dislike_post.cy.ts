// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes a post from another user exists (seeded or created via API)
// Assumes Post Page Object exists

describe("[SocialTeam] Posts - Dislike Post [functional]", () => {
  let targetPostId: string;

  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    // TODO: Create a post by another user
    // Example: cy.createPostByApi({ userId: 'otherUser', content: 'Post to be disliked' }).then(postId => { targetPostId = postId; });
    cy.visit("/");

    cy.intercept("POST", "/api/posts/*/dislikes").as("dislikeRequest");
    cy.intercept("POST", "/api/posts/*/likes").as("likeRequest");
  });

  it("should allow user to dislike a post and see the count update", () => {
    cy.contains('[data-testid="post-content"]', "Post to be disliked").within(
      () => {
        // Optional: Check initial dislike count

        // Click the dislike button
        cy.get('[data-testid="dislike-button"]').click();

        // Wait for API call and assert UI update
        cy.wait("@dislikeRequest");
        cy.get('[data-testid="dislike-count"]').should("contain", "1"); // Example
        cy.get('[data-testid="dislike-button"]').should("have.class", "active"); // Example
        // Optional: Assert like count is 0 if user previously liked it
      },
    );
  });

  it("should allow user to undislike a post previously disliked", () => {
    // TODO: Ensure post is disliked first
    // Example: cy.dislikePostByApi(targetPostId)
    cy.visit("/"); // Re-visit to ensure state

    cy.contains('[data-testid="post-content"]', "Post to be disliked").within(
      () => {
        // Click dislike button again
        cy.get('[data-testid="dislike-button"]').click();

        // Wait for API call and assert UI update
        cy.wait("@dislikeRequest"); // Might need different alias if undislike is DELETE
        cy.get('[data-testid="dislike-count"]').should("contain", "0"); // Example
        cy.get('[data-testid="dislike-button"]').should(
          "not.have.class",
          "active",
        ); // Example
      },
    );
  });
});
