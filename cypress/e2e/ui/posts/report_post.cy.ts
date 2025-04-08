// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes a post exists (seeded/created)
// Assumes reporting feature/API exists

describe("[SocialTeam] Posts - Report Post [functional]", () => {
  let targetPostId: string;
  const postContent = "Post to be reported";

  beforeEach(() => {
    // TODO: Seed/create post
    // cy.loginByApi("testuser", Cypress.env("password"));
    cy.loginViaUi();
    cy.visit("/");
    // Intercept report API
    cy.intercept("POST", `/api/posts/${targetPostId}/report`).as("reportPost"); // Adjust endpoint
  });

  it("should allow user to report a post", () => {
    // Find the specific post
    cy.contains('[data-testid="post-content"]', postContent).within(() => {
      // Open the post options menu
      cy.get('[data-testid="post-options-menu"]').click();

      // Click the report post option
      cy.get('[data-testid="report-post-option"]').click();
    });

    // Assuming a confirmation dialog or reason selection appears
    // cy.get('[data-testid="report-reason-spam"]').click(); // Example reason selection
    // cy.get('[data-testid="confirm-report-post"]').click();

    // Wait for API call
    cy.wait("@reportPost");

    // Assert success feedback (e.g., toast message, option disappears)
    cy.contains("Post reported").should("be.visible"); // Example toast

    // Optional: Re-open menu and assert report option is gone or changed
  });
});
