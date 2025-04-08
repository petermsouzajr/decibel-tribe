// Assumes logged-in user (use cy.loginByApi)

describe("[SocialTeam] Posts - Character Limit [functional]", () => {
  const charLimit = 500; // Example limit
  const overLimitText = "a".repeat(charLimit + 10);
  const limitText = "a".repeat(charLimit);

  beforeEach(() => {
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/");
  });

  it("should prevent typing past the character limit in the post editor", () => {
    // Type text exceeding the limit
    cy.get('[data-testid="post-editor-input"]').type(overLimitText);

    // Assert the input value is truncated to the limit
    cy.get('[data-testid="post-editor-input"]').should("have.value", limitText);

    // Optional: Assert a character counter display shows the limit reached
    cy.get('[data-testid="post-char-counter"]').should(
      "contain",
      `${charLimit}/${charLimit}`,
    );
  });

  it("should allow posting exactly at the character limit", () => {
    cy.intercept("POST", "/api/posts").as("createPost");
    cy.get('[data-testid="post-editor-input"]').type(limitText);
    cy.get('[data-testid="post-editor-submit"]')
      .should("not.be.disabled")
      .click();
    cy.wait("@createPost").its("response.statusCode").should("eq", 201); // Or other success code
    cy.contains('[data-testid="post-content"]', limitText).should("be.visible");
  });
});
