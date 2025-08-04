// Assumes logged-in user is member of 'emptyGroup' which has NO posts

describe("[GroupsTeam] Groups - View Feed Empty State [functional]", () => {
  let groupId: string;

  beforeEach(() => {
    // TODO: Ensure group exists, user is member, group has 0 posts
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/groups/${groupId}`);
  });

  it("should display an empty state message in the group feed", () => {
    // Assert no posts are rendered within the group feed container
    cy.get('[data-testid="group-post-feed"]')
      .find('[data-testid="post-content"]')
      .should("not.exist");

    // Assert empty state message is visible
    cy.get('[data-testid="group-post-feed"]')
      .contains("No posts in this group yet")
      .should("be.visible");
    cy.get('[data-testid="group-post-feed"]')
      .contains("Be the first to post!")
      .should("be.visible"); // Example
  });
});
