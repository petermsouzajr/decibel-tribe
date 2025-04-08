// Assumes logged-in user 'groupOwner' owns group 'ownerGroup' (seeded/created)
// Assumes another user 'inviteeUser' exists
// Assumes GroupPage and AddUserModal Page Objects exist

describe("[GroupsTeam] Groups - Invite User [functional]", () => {
  const groupName = "ownerGroup";
  const inviteeUsername = "inviteeUser";
  let groupId: string;

  beforeEach(() => {
    // cy.loginByApi("groupOwner", Cypress.env("password"));
    cy.loginViaUi();
    // TODO: Ensure group exists and get its ID, ensure inviteeUser exists
    // Example: cy.createGroupByApi({ name: groupName, owner: 'groupOwner' }).then(id => groupId = id);
    cy.visit(`/groups/${groupId}`); // Visit the specific group page

    // Intercept the add user/invite API
    cy.intercept("POST", `/api/groups/${groupId}/add-user`).as("inviteUser");
  });

  it("should allow the group owner to invite another user", () => {
    // Open the add user modal (assuming button exists on group page for owner)
    cy.get('[data-testid="add-user-button"]').click(); // Example

    // Use AddUserModal Page Object
    // AddUserModal.searchForUser(inviteeUsername);
    // AddUserModal.selectUser(inviteeUsername);
    // AddUserModal.submitInvitation();
    cy.get('[data-testid="user-search-input"]').type(inviteeUsername); // Example
    cy.contains('[data-testid="user-search-result"]', inviteeUsername).click(); // Example
    cy.get('[data-testid="invite-user-submit"]').click(); // Example

    // Wait for API call and assert modal closes
    cy.wait("@inviteUser");
    cy.get('[role="dialog"]').should("not.exist");

    // Optional: Verify notification sent to inviteeUser (hard to test via E2E)
    // Optional: Verify invitee appears in a pending/invited list if UI exists
  });
});
