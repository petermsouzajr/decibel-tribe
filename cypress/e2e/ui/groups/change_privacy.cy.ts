// Assumes logged-in user 'groupOwner' owns group 'privacyGroup' (seeded/created as public)
// Assumes GroupPage Page Object exists with edit capabilities

describe("[GroupsTeam] Groups - Change Privacy [functional]", () => {
  // Assumes logged-in user 'groupOwner' owns group 'privacyGroup' (seeded/created as public)
  // Assumes GroupPage Page Object exists with edit capabilities

  let groupId: string;
  const groupName = "privacyGroup";

  beforeEach(() => {
    // TODO: Seed/create group owned by groupOwner, ensure it is PUBLIC
    // Example: cy.createGroupByApi({ name: groupName, owner: 'groupOwner', isPrivate: false }).then(id => groupId = id);
    // cy.loginByApi("groupOwner", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/groups/${groupId}`);
    cy.intercept("PATCH", `/api/groups/${groupId}`).as("updateGroup");
  });

  it("should allow group owner to change group privacy from public to private", () => {
    // Go to edit group settings
    cy.get('[data-testid="edit-group-button"]').click();

    // Change privacy setting (e.g., toggle switch, radio button)
    // EditGroupPage.elements.privacyToggle().click();
    cy.get('[data-testid="group-privacy-toggle"]').click(); // Example

    // Submit changes
    cy.get('[data-testid="edit-group-submit"]').click();
    cy.wait("@updateGroup");

    // Assert privacy change reflected on group page (e.g., badge, text)
    // GroupPage.elements.privacyIndicator().should('contain', 'Private');
    cy.get('[data-testid="group-privacy-indicator"]').should(
      "contain",
      "Private",
    ); // Example

    // Optional: Logout and try accessing group as non-member, should fail for private group
  });

  // Add test for changing from private to public
});
