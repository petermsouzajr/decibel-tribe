// Assumes logged-in user 'groupOwner' owns group 'ownerGroup'
// Assumes 'adminToDemote' is an ADMIN/MODERATOR of the group

describe("[GroupsTeam] Groups - Demote Member [functional]", () => {
  let groupId: string;
  const adminToDemote = "adminToDemote";

  beforeEach(() => {
    // TODO: Ensure group exists, owner owns it, adminToDemote is an ADMIN
    // cy.loginByApi("groupOwner", Cypress.env("password"));
    cy.loginViaUi();
    // Example: cy.promoteMemberByApi(groupId, adminToDemote, 'admin');
    cy.visit(`/groups/${groupId}`);
    // Intercept demotion API
    cy.intercept("PATCH", `/api/groups/${groupId}/member/${adminToDemote}`).as(
      "demoteMember",
    );
  });

  it("should allow group owner to demote an Admin/Moderator back to member", () => {
    // Navigate to members list if needed

    // Find the admin and click demote action
    cy.contains('[data-testid="member-list-item"]', adminToDemote).within(
      () => {
        cy.get('[data-testid="member-options-menu"]').click();
        cy.get('[data-testid="demote-member-option"]').click(); // Example
      },
    );

    cy.wait("@demoteMember");

    // Assert member now has regular member status (no badge or specific role text)
    cy.contains('[data-testid="member-list-item"]', adminToDemote).within(
      () => {
        cy.get('[data-testid="member-role-badge"]').should("not.exist"); // Example
      },
    );
  });
});
