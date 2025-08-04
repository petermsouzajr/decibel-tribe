// Assumes user 'viewerUser' exists
// Assumes user 'privateProfileUser' exists and has a PRIVATE profile
// Assumes viewerUser does NOT follow privateProfileUser

describe("[AuthTeam] User Profile - View Private Profile Fail [functional]", () => {
  const targetUsername = "privateProfileUser";

  beforeEach(() => {
    // TODO: Ensure viewerUser exists, privateProfileUser exists and IS PRIVATE, no follow relationship
    // cy.loginByApi("viewerUser", Cypress.env("password"));
    cy.loginViaUi();
  });

  it("should restrict access when viewing a private profile not followed", () => {
    cy.visit(`/users/${targetUsername}`, { failOnStatusCode: false }); // Allow non-200 status codes if backend restricts access that way

    // Option 1: Check for redirection (e.g., back to feed or an error page)
    // cy.url().should('not.include', `/users/${targetUsername}`);

    // Option 2: Check for specific "Private Profile" message on the page
    cy.contains("This profile is private").should("be.visible"); // Example message
    cy.get('[data-testid="post-feed"]').should("not.exist"); // Example: Ensure posts aren't shown

    // Option 3: Check for HTTP status code if backend returns 403/404 directly (less common for SPA navigation)
  });
});
