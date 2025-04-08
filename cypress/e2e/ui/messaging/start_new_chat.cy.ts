// Assumes logged-in user 'currentUser' (use cy.loginByApi)
// Assumes 'targetUser' exists and has NO existing chat with currentUser
// Assumes NewChatDialog Page Object exists

describe("[MessagingTeam] Messaging - Start New Chat [functional]", () => {
  const targetUsername = "targetUser";

  beforeEach(() => {
    // TODO: Ensure targetUser exists and no prior chat channel exists
    // cy.loginByApi("currentUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/messages"); // Visit messages page

    // Intercept API for creating a new channel (Stream Chat specific?)
    // cy.intercept('POST', '/api/chat/channels').as('createChannel');
  });

  it("should allow user to start a new chat via the New Chat dialog", () => {
    // Open the New Chat dialog
    cy.get('[data-testid="new-chat-button"]').click(); // Example

    // Use NewChatDialog Page Object
    // NewChatDialog.searchAndSelectUser(targetUsername);
    // NewChatDialog.startChat();
    cy.get('[data-testid="user-search-input"]').type(targetUsername); // Example
    cy.contains('[data-testid="user-search-result"]', targetUsername).click(); // Example
    cy.get('[data-testid="start-chat-submit"]').click(); // Example

    // Wait for channel creation/navigation (might be UI update rather than API wait)
    // cy.wait('@createChannel');

    // Assert the dialog closes
    cy.get('[role="dialog"]').should("not.exist");

    // Assert the chat window for targetUser is now active
    // ChatPage.elements.activeChatHeader().should('contain', targetUsername);
    cy.get('[data-testid="chat-header"]').should("contain", targetUsername); // Example

    // Assert the new chat appears in the sidebar
    cy.get('[data-testid="chat-sidebar-item"]')
      .contains(targetUsername)
      .should("be.visible");
  });
});
