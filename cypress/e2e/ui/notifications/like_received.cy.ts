// Assumes user 'postOwner' has a post (seeded/created)
// Assumes user 'likerUser' liked that post, generating a notification for postOwner
// Assumes NotificationsPage Page Object exists

describe("[NotificationsTeam] Notifications - Like Received [functional]", () => {
  let targetPostId: string;
  const likerUsername = "likerUser";

  beforeEach(() => {
    // TODO: Seed/create post by postOwner, like by likerUser
    // Example: cy.createPostByApi(...).then(id => { targetPostId = id; cy.likePostByApi(targetPostId, 'likerUser'); });
    // cy.loginByApi("postOwner", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/notifications");
  });

  it("should display a notification when another user likes own post", () => {
    // Find the like notification
    // NotificationsPage.elements.likeNotification(likerUsername, targetPostId).should('be.visible');
    cy.contains(
      '[data-testid="notification-item"]',
      `${likerUsername} liked your post`,
    ).should("be.visible"); // Example
  });

  it("should navigate to the relevant post when clicking a like notification", () => {
    // Click the like notification
    cy.contains(
      '[data-testid="notification-item"]',
      `${likerUsername} liked your post`,
    ).click();

    // Assert navigation to the post detail page
    cy.url().should("include", `/posts/${targetPostId}`);
  });
});
