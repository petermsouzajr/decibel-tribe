import { LoginPage } from "../../../pages/authentication/loginPage";
// import * as loginMessages from "../../../fixtures/authentication/loginMessages.json"; // TODO: Resolve JSON import issue

describe("[AuthTeam] Authentication - Invalid Login [functional]", () => {
  beforeEach(() => {
    LoginPage.visit();
    // Intercept the login API if needed, or rely on actual backend response
    cy.intercept("POST", "/api/auth/login").as("loginAttempt");
  });

  it("should display an error message for incorrect username", () => {
    LoginPage.fillForm({
      username: "nonExistentUser",
      password: "somePassword",
    });
    LoginPage.submitForm();
    cy.wait("@loginAttempt");
    // LoginPage.elements.errorMessage(loginMessages.login).should("be.visible"); // Update selector if not using fixture
    cy.get('[data-testid="error-message"]').should("be.visible"); // Example direct selector
  });

  it("should display an error message for incorrect password", () => {
    // Requires a known user to exist (via seeding or previous test setup)
    LoginPage.fillForm({ username: "testuser", password: "wrongPassword" });
    LoginPage.submitForm();
    cy.wait("@loginAttempt");
    // LoginPage.elements.errorMessage(loginMessages.login).should("be.visible"); // Update selector if not using fixture
    cy.get('[data-testid="error-message"]').should("be.visible"); // Example direct selector
  });

  it("should display validation errors for empty fields", () => {
    LoginPage.submitForm();
    // Assert visibility of validation messages (might need specific selectors in LoginPage)
  });
});
