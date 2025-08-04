// Assumes logged-in user (use cy.loginByApi)

describe("[SocialTeam] Posts - Long Content Handling [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/");
    cy.intercept("POST", "/api/posts").as("createPost");
  });

  it("should truncate long posts in the feed and allow expansion", () => {
    const longContent = "Lorum ipsum dolor sit amet...".repeat(20); // Create long string
    const truncatedContent = longContent.substring(0, 200); // Estimate truncation length

    // Create a long post
    cy.get('[data-testid="post-editor-input"]').type(longContent);
    cy.get('[data-testid="post-editor-submit"]').click();
    cy.wait("@createPost");

    // Find the post in the feed
    cy.get('[data-testid="post-content"]')
      .contains(truncatedContent)
      .as("longPost");

    // Assert the full content is NOT initially visible
    cy.get("@longPost").should(
      "not.contain",
      longContent.substring(longContent.length - 50),
    ); // Check end part isn't visible

    // Assert a "Read More" button/link exists
    cy.get("@longPost")
      .find('[data-testid="read-more-button"]')
      .should("be.visible")
      .click(); // Example

    // Assert the full content IS now visible
    cy.get("@longPost").should(
      "contain",
      longContent.substring(longContent.length - 50),
    );

    // Assert the "Read More" button is gone or changed to "Show Less"
    cy.get("@longPost")
      .find('[data-testid="read-more-button"]')
      .should("not.exist");
    // cy.get('@longPost').find('[data-testid="show-less-button"]').should('be.visible');
  });
});
