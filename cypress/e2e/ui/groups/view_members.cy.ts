// Assumes logged-in user 'testuser' is member of group 'memberGroup' (seeded/created)
// Assumes 'otherMember' is also a member
// Assumes GroupPage Page Object exists

describe("[GroupsTeam] Groups - View Members [functional]", () => {
  const groupName = "memberGroup";
  let groupId: string;

  beforeEach(() => {
    // TODO: Ensure group exists, testuser and otherMember are members
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    // Example: cy.joinGroupByApi(groupId, 'testuser'); cy.joinGroupByApi(groupId, 'otherMember');
    cy.visit(`/groups/${groupId}`);
  });

  it("should display the list of group members", () => {
    // Navigate to members list if it's on a separate tab/page
    // GroupPage.elements.membersTab().click();

    // Assert own username is present
    // GroupPage.elements.memberListItem('testuser').should('be.visible');
    cy.get('[data-testid="group-member-list"]').should("contain", "testuser"); // Example

    // Assert other known member is present
    // GroupPage.elements.memberListItem('otherMember').should('be.visible');
    cy.get('[data-testid="group-member-list"]').should(
      "contain",
      "otherMember",
    ); // Example

    // Optional: Assert member count if displayed
    // cy.get('[data-testid="member-count"]').should('contain', '2');
  });
});
