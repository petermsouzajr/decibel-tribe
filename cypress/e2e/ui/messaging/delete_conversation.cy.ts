// Assumes logged-in user 'currentUser' has chat with 'otherUser' (seeded/created)
// Assumes ChatPage Page Object exists with delete functionality

describe("[MessagingTeam] Messaging - Delete Conversation [functional]", () => {
  const otherUsername = "otherUser";
  let channelId: string;

  beforeEach(() => {
    // TODO: Ensure chat channel exists between currentUser and otherUser
    // cy.loginByApi("currentUser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/messages");
    // Intercept delete channel API (if applicable)
    // cy.intercept('DELETE', `/api/chat/channels/${channelId}`).as('deleteChannel');
  });

  it("should allow user to delete a conversation from the sidebar", () => {
    // Find the conversation in the sidebar
    // ChatPage.elements.chatSidebarItem(otherUsername).within(() => {
    cy.contains('[data-testid="chat-sidebar-item"]', otherUsername).within(
      () => {
        // Click options/delete button for the conversation
        // ChatPage.elements.conversationOptionsMenu().click();
        // ChatPage.elements.deleteConversationOption().click();
        cy.get('[data-testid="conversation-options-menu"]').click(); // Example
        cy.get('[data-testid="delete-conversation-option"]').click(); // Example
      },
    );

    // Confirm deletion if necessary
    // cy.get('[data-testid="confirm-delete-conversation"]').click();

    // Wait for API call or UI update
    // cy.wait('@deleteChannel');

    // Assert conversation is removed from the sidebar
    // ChatPage.elements.chatSidebarItem(otherUsername).should('not.exist');
    cy.get('[data-testid="chat-sidebar-item"]')
      .contains(otherUsername)
      .should("not.exist");
  });
});
