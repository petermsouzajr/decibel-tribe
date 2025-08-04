// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes user has several unread notifications (seeded/created via actions)
// Assumes NotificationsPage Page Object exists

describe("[NotificationsTeam] Notifications - Mark All Read [functional]", () => {
  beforeEach(() => {
    // TODO: Ensure user has multiple unread notifications via API actions (e.g., follows, likes)
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/notifications");
    // Intercept mark all read API
    cy.intercept("POST", "/api/notifications/mark-all-read").as("markAllRead"); // Adjust endpoint if needed
  });

  it("should allow user to mark all notifications as read", () => {
    // Verify unread indicator/count exists initially
    // cy.get('[data-testid="unread-notifications-indicator"]').should('exist');

    // Find and click the "Mark all as read" button
    // NotificationsPage.elements.markAllReadButton().click();
    cy.get('[data-testid="mark-all-read-button"]').click(); // Example

    cy.wait("@markAllRead");

    // Assert unread indicator/count disappears
    // cy.get('[data-testid="unread-notifications-indicator"]').should('not.exist');

    // Assert individual notifications no longer appear as unread (e.g., no highlight class)
    cy.get('[data-testid="notification-item"]').each(($el) => {
      cy.wrap($el).should("not.have.class", "unread"); // Example class check
    });
  });
});
