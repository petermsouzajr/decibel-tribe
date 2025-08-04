// Assumes logged-in user is member of 'activeGroup' with searchable posts

describe("[GroupsTeam] Groups - Search within Group [functional]", () => {
  let groupId: string;
  const searchTerm = "uniqueGroupPostContent";

  beforeEach(() => {
    // TODO: Ensure group exists, user is member, post with searchTerm exists within group
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit(`/groups/${groupId}`);
    // Intercept group-specific search API if it exists
    cy.intercept("GET", `/api/groups/${groupId}/search?*`).as("groupSearch");
  });

  it("should allow searching for posts within a specific group", () => {
    // Find and use the search input specific to the group page
    // GroupPage.elements.searchInput().type(`${searchTerm}{enter}`);
    cy.get('[data-testid="group-search-input"]').type(`${searchTerm}{enter}`); // Example

    cy.wait("@groupSearch");

    // Assert search results specific to the group are displayed
    cy.get('[data-testid="group-search-results"]').should(
      "contain",
      searchTerm,
    );
    // Assert results from outside the group are NOT shown (if possible to verify)
  });
});
