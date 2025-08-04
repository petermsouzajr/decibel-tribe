// Assumes logged-in user 'testuser' (use cy.loginByApi in beforeEach)
// Assumes another user 'followTarget' exists (seeded or created)
// Assumes UserProfilePage Page Object exists

describe("[SocialTeam] User Profile - Follow User [functional]", () => {
  const targetUsername = "followTarget";

  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    // TODO: Ensure targetUsername exists and is not followed by testuser
    cy.visit(`/users/${targetUsername}`);

    cy.intercept("POST", `/api/users/${targetUsername}/follow`).as(
      "followRequest",
    );
  });

  it("should allow user to follow another user from their profile page", () => {
    // Find and click the follow button
    // UserProfilePage.elements.followButton().click();
    cy.get('[data-testid="follow-button"]').click(); // Example

    // Wait for API and assert button text/state changes
    cy.wait("@followRequest");
    // UserProfilePage.elements.followButton().should('contain', 'Unfollow');
    cy.get('[data-testid="follow-button"]').should("contain", "Unfollow"); // Example

    // Optional: Verify follower count increases
    // cy.get('[data-testid="follower-count"]').should('contain', '1'); // Adjust based on initial state
  });

  it("should allow user to unfollow a user they previously followed", () => {
    // TODO: Ensure user is already following targetUsername (via API or previous action)
    // Example: cy.followUserByApi(targetUsername);
    cy.visit(`/users/${targetUsername}`); // Re-visit page to ensure correct initial state

    // Find and click the unfollow button
    cy.get('[data-testid="follow-button"][aria-label*="Unfollow"]').click(); // Example for unfollow state

    // Wait for API and assert button text/state changes
    cy.wait("@followRequest"); // Might be DELETE or different alias
    cy.get('[data-testid="follow-button"]').should("contain", "Follow");

    // Optional: Verify follower count decreases
  });
});
