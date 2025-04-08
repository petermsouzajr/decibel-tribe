// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes a group with name 'Existing Test Group' already exists (seeded or created)
// Assumes CreateGroupModal Page Object exists

describe("[GroupsTeam] Groups - Create Duplicate Name Fail [functional]", () => {
  const existingGroupName = "Existing Test Group";

  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    // TODO: Ensure group with existingGroupName exists
    cy.visit("/groups"); // Navigate to the groups page
    cy.intercept("POST", "/api/groups").as("createGroup");
  });

  it("should show an error when trying to create a group with an existing name", () => {
    // Open the create group modal
    cy.get('[data-testid="create-group-button"]').click(); // Example

    // Use CreateGroupModal Page Object
    // CreateGroupModal.fillForm({ name: existingGroupName, description: 'Some desc' });
    // CreateGroupModal.submit();
    cy.get('[data-testid="group-name-input"]').type(existingGroupName); // Example
    cy.get('[data-testid="group-description-input"]').type("Some description"); // Example
    cy.get('[data-testid="create-group-submit"]').click(); // Example

    // Wait for API call and assert error message is visible within the modal
    cy.wait("@createGroup");
    // CreateGroupModal.elements.errorMessage().should('be.visible').and('contain', 'Group name already taken');
    cy.get('[role="dialog"]').within(() => {
      cy.get('[data-testid="error-message"]').should("be.visible"); // Example
    });

    // Assert modal is still open
    cy.get('[role="dialog"]').should("be.visible");
  });
});
