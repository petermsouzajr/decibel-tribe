// Assumes logged-in user (use cy.loginByApi)
// Assumes chat exists with 'otherUser'

describe("[MessagingTeam] Messaging - API Error Handling [functional]", () => {
  const otherUsername = "otherUser";

  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/messages");
    cy.contains('[data-testid="chat-sidebar-item"]', otherUsername).click();
  });

  it("should show an error toast/message if sending fails (500 error)", () => {
    // Intercept send message API and force a 500 error
    cy.intercept("POST", "/api/chat/channels/*/message", {
      // Adjust endpoint
      statusCode: 500,
      body: { error: "Internal Server Error" },
    }).as("sendMessageFail");

    // Attempt to send a message
    cy.get('[data-testid="message-input"]').type(
      "This message will fail{enter}",
    );

    cy.wait("@sendMessageFail");

    // Assert error message is shown (e.g., via toast)
    // cy.get('[data-testid="toast-error"]').should('contain', 'Failed to send message');
    cy.contains("Failed to send message").should("be.visible"); // Example

    // Assert the message did NOT appear optimistically in the chat list
    cy.get('[data-testid="message-list"]').should(
      "not.contain",
      "This message will fail",
    );
  });
});
