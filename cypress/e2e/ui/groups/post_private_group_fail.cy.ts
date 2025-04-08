// Assumes user 'nonMemberUser' exists
// Assumes group 'privateGroup' exists and is PRIVATE
// Assumes nonMemberUser is NOT a member

describe("[GroupsTeam] Groups - Post in Private Group Fail [functional]", () => {
  let groupId: string;
  const groupName = "privateGroup";

  beforeEach(() => {
    // TODO: Ensure nonMemberUser exists, group exists, is PRIVATE, user not member
    // cy.loginByApi("nonMemberUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/groups/${groupId}`, { failOnStatusCode: false }); // Visit private group page
  });

  it("should not allow a non-member to post in a private group", () => {
    // Assert restricted view is shown (similar to viewing private profile)
    cy.contains("This group is private").should("be.visible"); // Example

    // Crucially, assert that the post editor/input is NOT visible/available
    // GroupPage.elements.postEditorInput().should('not.exist');
    cy.get('[data-testid="post-editor-input"]').should("not.exist"); // Example
    cy.get('[data-testid="create-post-button"]').should("not.exist"); // Example
  });
});
