// Assumes logged-in user 'newUser' has NO posts and follows NOBODY

describe("[SocialTeam] Posts - Feed Empty State [functional]", () => {
  beforeEach(() => {
    // TODO: Ensure newUser exists, has 0 posts, follows 0 users
    // cy.loginByApi("newUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/");
  });

  it("should display an empty state message on the main feed", () => {
    // Assert that no posts are rendered
    cy.get('[data-testid="post-content"]').should("not.exist");

    // Assert that an empty state message/component is visible
    // HomePage.elements.emptyFeedMessage().should('be.visible');
    cy.contains("Your feed is empty").should("be.visible"); // Example text
    cy.contains("Follow some users or create a post").should("be.visible"); // Example suggestion
  });
});
