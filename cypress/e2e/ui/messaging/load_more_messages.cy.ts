// Assumes logged-in user has chat with > N messages (where N is page size)

describe("[MessagingTeam] Messaging - Load More Messages [functional]", () => {
  const otherUsername = "longChatUser";
  const initialMsgCount = 20; // Example page size

  beforeEach(() => {
    // TODO: Ensure chat exists with > initialMsgCount messages
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/messages");
    cy.contains('[data-testid="chat-sidebar-item"]', otherUsername).click();
    // Intercept message fetching API
    cy.intercept("GET", "/api/chat/channels/*/messages?*").as("getMessages");
  });

  it("should load older messages when scrolling to the top of the chat window", () => {
    // Wait for initial messages to load
    cy.wait("@getMessages");
    cy.get('[data-testid="message-list-item"]').should(
      "have.length.at.least",
      initialMsgCount,
    );

    // Find the topmost message
    cy.get('[data-testid="message-list-item"]')
      .first()
      .as("firstInitialMessage");

    // Scroll to the top of the message container
    // cy.get('[data-testid="message-scroll-container"]').scrollTo('top'); // Example
    cy.get('[data-testid="message-list"]').scrollTo("top");

    // Wait for older messages request/response
    cy.wait("@getMessages");

    // Assert total message count is now greater
    cy.get('[data-testid="message-list-item"]').should(
      "have.length.greaterThan",
      initialMsgCount,
    );

    // Assert the previously first message is still present
    cy.get("@firstInitialMessage").should("be.visible");
  });
});
