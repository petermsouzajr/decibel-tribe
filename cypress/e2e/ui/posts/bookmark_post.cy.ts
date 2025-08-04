// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes a post exists (seeded or created via API in beforeEach)
// Assumes Post Page Object and BookmarksPage Page Object exist

describe("[SocialTeam] Posts - Bookmark Post [functional]", () => {
  let targetPostId: string;
  let postContent: string = "Post to be bookmarked";

  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    // TODO: Create a post via API or seeding
    // Example: cy.createPostByApi({ userId: 'otherUser', content: postContent }).then(postId => { targetPostId = postId; });
    cy.visit("/"); // Visit the feed

    cy.intercept("POST", "/api/posts/*/bookmark").as("bookmarkRequest");
  });

  it("should allow user to bookmark a post", () => {
    // Find the specific post
    cy.contains('[data-testid="post-content"]', postContent).within(() => {
      // Click bookmark button
      // PostPage.elements.bookmarkButton().click();
      cy.get('[data-testid="bookmark-button"]').click(); // Example
    });

    // Wait for API and check button state if applicable
    cy.wait("@bookmarkRequest");
    // cy.get('[data-testid="bookmark-button"]').should('have.class', 'active'); // Example active state

    // Navigate to bookmarks page
    // NavbarPage.elements.bookmarksLink().click();
    cy.visit("/bookmarks"); // Example direct navigation

    // Assert bookmarked post appears on the bookmarks page
    // BookmarksPage.elements.postContent(postContent).should('be.visible');
    cy.contains('[data-testid="post-content"]', postContent).should(
      "be.visible",
    ); // Example
  });

  it("should allow user to unbookmark a post from the feed", () => {
    // TODO: Ensure post is bookmarked first (via API or previous action)
    // Example: cy.bookmarkPostByApi(targetPostId);

    cy.visit("/"); // Back to feed

    // Find the specific post
    cy.contains('[data-testid="post-content"]', postContent).within(() => {
      // Click bookmark button again
      cy.get('[data-testid="bookmark-button"]').click();
    });

    cy.wait("@bookmarkRequest"); // Might be DELETE or different alias

    // Navigate to bookmarks page
    cy.visit("/bookmarks");

    // Assert post is no longer on the bookmarks page
    cy.contains('[data-testid="post-content"]', postContent).should(
      "not.exist",
    );
  });

  it("should allow user to unbookmark a post from the bookmarks page", () => {
    // TODO: Ensure post is bookmarked first (via API or previous action)
    // Example: cy.bookmarkPostByApi(targetPostId);

    cy.visit("/bookmarks");

    // Find the post on the bookmarks page
    cy.contains('[data-testid="post-content"]', postContent).within(() => {
      // Click bookmark button within the post on this page
      cy.get('[data-testid="bookmark-button"]').click();
    });

    cy.wait("@bookmarkRequest"); // Might be DELETE or different alias

    // Assert post disappears from the bookmarks page
    cy.contains('[data-testid="post-content"]', postContent).should(
      "not.exist",
    );
  });
});
