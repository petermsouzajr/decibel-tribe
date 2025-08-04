// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes user 'searchTargetUser' exists (seeded/created)
// Assumes SearchPage Page Object exists

describe.skip("[SocialTeam] Search - Click Through User Result [functional]", () => {
  const targetUsername = "searchTargetUser";

  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    // TODO: Ensure targetUsername exists
    cy.visit("/search");
    cy.intercept("GET", "/api/search?*").as("searchRequest");
  });

  it("should allow user to search for a user and click through to their profile", () => {
    // Search for the target user
    cy.get('input[type="search"]').type(`${targetUsername}{enter}`);
    cy.wait("@searchRequest");

    // Ensure the Users tab is active or switch to it
    // cy.get('[data-testid="search-tab-users"]').click();

    // Find the user in the results and click their link/card
    // SearchPage.elements.userResultLink(targetUsername).click();
    cy.get('[data-testid="search-results-users"]')
      .contains(targetUsername)
      .click(); // Example

    // Assert navigation to the target user's profile page
    cy.url().should("include", `/users/${targetUsername}`);
    cy.get('[data-testid="profile-username"]').should(
      "contain",
      targetUsername,
    ); // Example check on profile page
  });
});
