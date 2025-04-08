// Assumes user 'nonMemberUser' exists
// Assumes group 'privateGroup' exists and is PRIVATE
// Assumes nonMemberUser is NOT a member

describe("[GroupsTeam] Groups - View Private Member List Fail [functional]", () => {
  let groupId: string;
  const groupName = "privateGroup";

  beforeEach(() => {
    // TODO: Ensure nonMemberUser exists, group exists, is PRIVATE, user not member
    // cy.loginByApi("nonMemberUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/groups/${groupId}`, { failOnStatusCode: false }); // Visit private group page
  });

  it("should not allow a non-member to view the member list of a private group", () => {
    // Assert restricted view is shown
    cy.contains("This group is private").should("be.visible");

    // Assert that the members tab/link is NOT visible/clickable, or member list section doesn't exist
    // GroupPage.elements.membersTab().should('not.exist');
    cy.get('[data-testid="group-members-tab"]').should("not.exist"); // Example
    cy.get('[data-testid="group-member-list"]').should("not.exist"); // Example
  });
});
