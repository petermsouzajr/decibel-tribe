// Assumes logged-in user 'senderUser' exists
// Assumes 'blockedUser' exists and has BLOCKED senderUser
// Assumes ChatPage Page Object exists

describe("[MessagingTeam] Messaging - Send to Blocked User Fail [functional]", () => {
  const blockedUsername = "blockedUser";
  let channelId: string; // ID of the chat channel if it exists

  beforeEach(() => {
    // TODO: Ensure senderUser exists, blockedUser exists and HAS BLOCKED senderUser
    // Example: cy.blockUserByApi('blockedUser', 'senderUser');
    // TODO: Optionally ensure chat channel exists (blocking might prevent creation)
    // cy.loginByApi("senderUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/messages");

    // Attempt to select/open chat with blocked user (might fail here)
    // cy.get('[data-testid="chat-sidebar-item"]').contains(blockedUsername).click({ force: true }); // Force click if selection is prevented
  });

  it("should prevent user from sending message to a user who blocked them", () => {
    // Option 1: Check if chat window shows a "blocked" message
    cy.get('[data-testid="chat-window"]').should(
      "contain",
      "You cannot message this user",
    ); // Example message

    // Option 2: Check if message input is disabled or hidden
    // ChatPage.elements.messageInput().should('be.disabled');
    cy.get('[data-testid="message-input"]').should("be.disabled"); // Example

    // Option 3: Attempt to type and send, verify failure (API intercept or lack of message appearing)
    // cy.get('[data-testid="message-input"]').type('This message should fail');
    // cy.get('[data-testid="send-message-button"]').click();
    // Assert message does NOT appear in list, potentially check for error toast
  });
});
