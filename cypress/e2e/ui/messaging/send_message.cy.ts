// Assumes logged-in user 'senderUser' (use cy.loginByApi)
// Assumes an existing chat channel exists with 'receiverUser' (seeded/created)
// Assumes ChatPage Page Object exists

describe("[MessagingTeam] Messaging - Send Message [smoke]", () => {
  const receiverUsername = "receiverUser";
  let channelId: string; // ID of the chat channel

  beforeEach(() => {
    // TODO: Ensure chat channel between senderUser and receiverUser exists, get channelId
    // cy.loginByApi("senderUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/messages"); // Visit messages page

    // Select the specific chat channel from the sidebar
    // ChatPage.elements.chatSidebarItem(receiverUsername).click();
    cy.get('[data-testid="chat-sidebar-item"]')
      .contains(receiverUsername)
      .click(); // Example

    // Intercept message sending API (if applicable, Stream Chat might handle differently)
    // cy.intercept('POST', `/api/chat/channels/${channelId}/message`).as('sendMessage');
  });

  it("should allow user to send a message in an existing chat", () => {
    const messageText = "Hello from Cypress test!";

    // Use ChatPage Page Object
    // ChatPage.elements.messageInput().type(messageText);
    // ChatPage.elements.sendMessageButton().click();
    cy.get('[data-testid="message-input"]').type(`${messageText}{enter}`); // Example using enter key

    // Wait for message to appear in the chat window (Stream Chat might update UI directly)
    // cy.wait('@sendMessage'); // May not be needed if UI updates without explicit API call

    // Assert the sent message is visible in the message list
    // ChatPage.elements.messageText(messageText).should('be.visible');
    cy.get('[data-testid="message-list"]').should("contain", messageText);
  });
});
