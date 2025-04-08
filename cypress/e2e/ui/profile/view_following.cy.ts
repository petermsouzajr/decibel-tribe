// Assumes user 'testuser' follows 'followedUser1' and 'followedUser2' (seeded/created)
// Assumes UserProfilePage Page Object exists

describe("[SocialTeam] User Profile - View Following List [functional]", () => {
  beforeEach(() => {
    // TODO: Ensure testuser exists and follows followedUser1, followedUser2
    // cy.loginByApi("testuser", Cypress.env("password"));
    // Example: cy.followUserByApi('testuser', 'followedUser1'); cy.followUserByApi('testuser', 'followedUser2');
    cy.loginViaUi();
    cy.visit(`/users/testuser`); // Visit own profile
  });

  it("should display the list of users being followed", () => {
    // Click the following count/link
    // UserProfilePage.elements.followingLink().click();
    cy.get('[data-testid="following-link"]').click(); // Example

    // Assert the following list/modal is visible
    // cy.get('[data-testid="following-modal"]').should('be.visible');

    // Assert known followed users are present
    // UserProfilePage.elements.followingListItem('followedUser1').should('be.visible');
    // UserProfilePage.elements.followingListItem('followedUser2').should('be.visible');
    cy.get('[data-testid="following-list-item"]')
      .contains("followedUser1")
      .should("be.visible"); // Example
    cy.get('[data-testid="following-list-item"]')
      .contains("followedUser2")
      .should("be.visible"); // Example
  });

  it("should allow clicking through to a followed user profile", () => {
    cy.get('[data-testid="following-link"]').click();

    // Click on a specific followed user
    // UserProfilePage.elements.followingListItem('followedUser1').click();
    cy.get('[data-testid="following-list-item"]')
      .contains("followedUser1")
      .click(); // Example

    // Assert navigation to the followed user's profile page
    cy.url().should("include", "/users/followedUser1");
    cy.get('[data-testid="profile-username"]').should(
      "contain",
      "followedUser1",
    );
  });
});
