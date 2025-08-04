// Assumes logged-in user 'newUser' has ZERO notifications

describe("[NotificationsTeam] Notifications - Empty State [functional]", () => {
  beforeEach(() => {
    // TODO: Ensure user exists and has 0 notifications (clean slate)
    // cy.loginByApi("newUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/notifications");
  });

  it("should display an empty state message when there are no notifications", () => {
    // Assert no notification items are rendered
    cy.get('[data-testid="notification-item"]').should("not.exist");

    // Assert empty state message is visible
    cy.contains("You have no notifications").should("be.visible"); // Example text
  });
});
