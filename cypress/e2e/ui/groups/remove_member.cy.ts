// Assumes logged-in user 'groupOwner' owns group 'ownerGroup' (seeded/created)
// Assumes 'userToRemove' is a member of the group
// Assumes GroupPage Page Object exists

describe("[GroupsTeam] Groups - Remove Member [functional]", () => {
  const groupName = "ownerGroup";
  const userToRemove = "userToRemove";
  let groupId: string;

  beforeEach(() => {
    // TODO: Ensure group exists, owner owns it, userToRemove is a member
    // cy.loginByApi("groupOwner", Cypress.env("password"));
    cy.loginViaUi();
    // Example: cy.joinGroupByApi(groupId, userToRemove);
    cy.visit(`/groups/${groupId}`);

    // Intercept remove user API (assuming DELETE method)
    cy.intercept("DELETE", `/api/groups/${groupId}/member/${userToRemove}`).as(
      "removeMember",
    );
  });

  it("should allow the group owner to remove another member", () => {
    // Navigate to members list if needed
    // GroupPage.elements.membersTab().click();

    // Find the member in the list and click the remove button/icon
    // GroupPage.elements.memberListItem(userToRemove).within(() => {
    //   GroupPage.elements.removeMemberButton().click();
    // });
    cy.contains('[data-testid="member-list-item"]', userToRemove).within(() => {
      cy.get('[data-testid="remove-member-button"]').click(); // Example
    });

    // Confirm removal if a confirmation dialog appears
    // cy.get('[data-testid="confirm-remove-member"]').click();

    // Wait for API call
    cy.wait("@removeMember");

    // Assert user is no longer in the member list
    // GroupPage.elements.memberListItem(userToRemove).should('not.exist');
    cy.get('[data-testid="group-member-list"]').should(
      "not.contain",
      userToRemove,
    );
  });
});
