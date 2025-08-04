import { LoginPage } from "../pages/authentication/loginPage";

Cypress.Commands.add("logoutByApi", () => {
  // Assuming session is stored in a cookie named 'session'
  // Adjust cookie name if necessary
  cy.clearCookie("session");
});

Cypress.Commands.add(
  "loginViaUi",
  // Explicitly type parameters
  (username?: string | null, password?: string | null) => {
    // Use provided credentials or fallback to hardcoded values
    // WARNING: Hardcoding credentials is not recommended best practice.
    // Prefer environment variables or passing arguments from tests.
    const user = username || "testUser2@test.com";
    const pw = password || "Password1!";

    LoginPage.visit();
    LoginPage.fillForm({ username: user, password: pw });
    LoginPage.submitForm();
    // Add verification step to ensure login was successful
    // This depends on what changes after login (e.g., URL, element visibility)
    cy.url().should("not.include", LoginPage.url); // Basic check: ensure URL changed
    cy.log(`Login successful for ${user}`);
  },
);
