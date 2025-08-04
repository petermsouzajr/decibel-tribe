// Assumes logged-in user 'joinerUser' is NOT a member of public group 'publicGroup'
// Assumes GroupPage Page Object exists

describe("[GroupsTeam] Groups - Join Public Group [functional]", () => {
  let groupId: string;
  const groupName = "publicGroup";

  beforeEach(() => {
    // TODO: Ensure group exists, is PUBLIC, and joinerUser is NOT a member
    // cy.loginByApi("joinerUser", Cypress.env("password"));
    cy.loginViaUi();
    // Navigate to group page (e.g., via search or direct visit)
    cy.visit(`/groups/${groupId}`); // Assumes ID is known

    // Intercept join request (if any - public might not have explicit join API)
    // May need to intercept member list fetch to verify update
  });

  it("should allow user to join a public group", () => {
    // Find and click the "Join Group" button (should be visible for non-members of public group)
    // GroupPage.elements.joinGroupButton().click();
    cy.get('[data-testid="join-public-group-button"]').click(); // Example

    // Assert button changes to "Leave Group" or similar state
    // GroupPage.elements.leaveGroupButton().should('be.visible');
    cy.get('[data-testid="leave-group-button"]').should("be.visible"); // Example
    cy.get('[data-testid="join-public-group-button"]').should("not.exist");

    // Optional: Verify user appears in member list if visible
  });
});
