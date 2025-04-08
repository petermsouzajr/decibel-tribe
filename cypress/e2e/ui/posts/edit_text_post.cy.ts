// Assumes logged-in user 'postOwner' created a post (seeded/created)
// Assumes Post Page Object exists with edit capabilities

describe("[SocialTeam] Posts - Edit Text Post [functional]", () => {
  let targetPostId: string;
  const initialContent = "Initial post content to be edited";
  const updatedContent = "Updated post content from Cypress!";

  beforeEach(() => {
    // TODO: Seed/create post by postOwner with initialContent
    // Example: cy.createPostByApi({ userId: 'postOwner', content: initialContent }).then(id => targetPostId = id);
    // cy.loginByApi("postOwner", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/"); // Or visit post page directly: /posts/${targetPostId}

    // Intercept post update API (assuming PUT or PATCH)
    cy.intercept("PATCH", `/api/posts/${targetPostId}`).as("updatePost");
  });

  it("should allow user to edit the text content of their own post", () => {
    // Find the specific post
    cy.contains('[data-testid="post-content"]', initialContent).within(() => {
      // Open the post options menu
      cy.get('[data-testid="post-options-menu"]').click(); // Example

      // Click the edit post option
      cy.get('[data-testid="edit-post-option"]').click(); // Example
    });

    // Assuming edit happens in a modal or inline editor
    // Use PostEditor Page Object or direct selectors
    // PostEditor.elements.editorInput().clear().type(updatedContent);
    // PostEditor.elements.submitEditButton().click();
    cy.get('[data-testid="post-edit-input"]').clear().type(updatedContent); // Example
    cy.get('[data-testid="post-edit-submit"]').click(); // Example

    // Wait for API call
    cy.wait("@updatePost");

    // Assert the post content is updated on the page
    cy.contains('[data-testid="post-content"]', updatedContent).should(
      "be.visible",
    );
    cy.contains('[data-testid="post-content"]', initialContent).should(
      "not.exist",
    );
  });
});
