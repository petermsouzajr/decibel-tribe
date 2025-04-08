// Assumes user 'profileOwner' is followed by 'follower1' and 'follower2' (seeded/created)
// Assumes UserProfilePage Page Object exists

describe("[SocialTeam] User Profile - View Followers List [functional]", () => {
  const profileOwnerUsername = "profileOwner";

  beforeEach(() => {
    // TODO: Ensure profileOwner exists and is followed by follower1, follower2
    // Example: cy.followUserByApi('follower1', profileOwnerUsername); cy.followUserByApi('follower2', profileOwnerUsername);
    // cy.loginByApi("anyUser", Cypress.env("password")); // Login as any user to view the profile
    cy.loginViaUi();
    cy.visit(`/users/${profileOwnerUsername}`);
  });

  it("should display the list of followers", () => {
    // Click the followers count/link to open the list/modal
    // UserProfilePage.elements.followersLink().click();
    cy.get('[data-testid="followers-link"]').click(); // Example

    // Assert the follower list/modal is visible
    // cy.get('[data-testid="followers-modal"]').should('be.visible');

    // Assert known followers are present in the list
    // UserProfilePage.elements.followerListItem('follower1').should('be.visible');
    // UserProfilePage.elements.followerListItem('follower2').should('be.visible');
    cy.get('[data-testid="follower-list-item"]')
      .contains("follower1")
      .should("be.visible"); // Example
    cy.get('[data-testid="follower-list-item"]')
      .contains("follower2")
      .should("be.visible"); // Example
  });

  it("should allow clicking through to a follower profile", () => {
    cy.get('[data-testid="followers-link"]').click();

    // Click on a specific follower in the list
    // UserProfilePage.elements.followerListItem('follower1').click();
    cy.get('[data-testid="follower-list-item"]').contains("follower1").click(); // Example

    // Assert navigation to the follower's profile page
    cy.url().should("include", "/users/follower1");
    cy.get('[data-testid="profile-username"]').should("contain", "follower1");
  });
});
