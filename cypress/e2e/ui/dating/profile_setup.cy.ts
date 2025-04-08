// Assumes logged-in user (use cy.loginByApi in beforeEach)
// Assumes dating feature flag/access is enabled for the user
// Assumes DatingSetupWizard Page Object(s) exist

describe.skip("[SocialTeam] Dating - Profile Setup Flow [functional]", () => {
  beforeEach(() => {
    // cy.loginByApi("newUserForDating", Cypress.env("password"));
    // TODO: Ensure user does NOT have an existing dating profile
    cy.visit("/dating/setup"); // Assuming entry point for setup
    // Intercept relevant API calls for saving dating profile steps
    cy.intercept("POST", "/api/dating/profile").as("saveDatingProfile");
  });

  it("should guide user through the dating profile setup steps", () => {
    // --- Step 1: Basic Info ---
    // DatingSetupWizard.Step1.fillInfo({ ... });
    // DatingSetupWizard.Step1.nextButton().click();
    cy.get('[data-testid="dating-setup-step1-next"]').click(); // Example

    // --- Step 2: Photos ---
    // DatingSetupWizard.Step2.uploadPhoto('fixtures/images/dating-photo1.jpg');
    // DatingSetupWizard.Step2.nextButton().click();
    cy.get('[data-testid="dating-setup-step2-next"]').click(); // Example

    // --- Step 3: Prompts/Bio ---
    // DatingSetupWizard.Step3.fillPrompt1('...');
    // DatingSetupWizard.Step3.nextButton().click();
    cy.get('[data-testid="dating-setup-step3-next"]').click(); // Example

    // --- Step 4: Preferences ---
    // DatingSetupWizard.Step4.setPreferences({ ... });
    // DatingSetupWizard.Step4.finishButton().click();
    cy.get('[data-testid="dating-setup-finish"]').click(); // Example

    // Wait for final save
    cy.wait("@saveDatingProfile");

    // Assert redirection to dating dashboard or match deck
    cy.url().should("include", "/dating/deck"); // Example target URL

    // Optional: Verify profile data was saved correctly (e.g., via API check)
  });
});
