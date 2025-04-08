// Assumes logged-in user 'groupOwner' owns group 'groupToEdit' (seeded/created)
// Assumes GroupPage Page Object exists with edit capabilities

describe("[GroupsTeam] Groups - Edit Group Info [functional]", () => {
  let groupId: string;
  const initialGroupName = "groupToEdit";
  const updatedGroupName = "Edited Group Name";
  const updatedDescription = "This group info has been updated.";

  beforeEach(() => {
    // TODO: Seed/create group owned by groupOwner
    // Example: cy.createGroupByApi({ name: initialGroupName, owner: 'groupOwner' }).then(id => groupId = id);
    // cy.loginByApi("groupOwner", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/groups/${groupId}`);

    // Intercept group update API (assuming PUT or PATCH)
    cy.intercept("PATCH", `/api/groups/${groupId}`).as("updateGroup");
  });

  it("should allow group owner to edit group name and description", () => {
    // Find and click the edit group button/link (available to owner)
    // GroupPage.elements.editGroupButton().click();
    cy.get('[data-testid="edit-group-button"]').click(); // Example

    // Assuming edit happens in a modal or dedicated edit page
    // EditGroupPage.fillName(updatedGroupName);
    // EditGroupPage.fillDescription(updatedDescription);
    // EditGroupPage.submit();
    cy.get('[data-testid="edit-group-name-input"]')
      .clear()
      .type(updatedGroupName); // Example
    cy.get('[data-testid="edit-group-description-input"]')
      .clear()
      .type(updatedDescription); // Example
    cy.get('[data-testid="edit-group-submit"]').click(); // Example

    // Wait for API call
    cy.wait("@updateGroup");

    // Assert navigation back to group page (if edit was on separate page) or modal closes
    // cy.url().should('include', `/groups/${groupId}`);
    // cy.get('[role="dialog"]').should('not.exist');

    // Assert updated info is displayed on the group page
    // GroupPage.elements.groupNameHeader().should('contain', updatedGroupName);
    // GroupPage.elements.groupDescription().should('contain', updatedDescription);
    cy.get('[data-testid="group-name-header"]').should(
      "contain",
      updatedGroupName,
    ); // Example
    cy.get('[data-testid="group-description"]').should(
      "contain",
      updatedDescription,
    ); // Example
  });
});
