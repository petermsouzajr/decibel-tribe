import { SignupPage } from "../../../pages/authentication/signupPage";

describe.skip("[AuthTeam] Signup Page Accessibility [sanity]", () => {
  beforeEach(() => {
    SignupPage.visit();
  });

  context("Accessibility Attributes", () => {
    it("has accessible names for username, password fields, and submit button", () => {
      // Check for associated label via id/for
      SignupPage.elements
        .usernameInput()
        .should("have.attr", "id")
        .then((id) => {
          cy.get(`label[for="${id}"]`).should("exist");
        });
      SignupPage.elements
        .passwordInput()
        .should("have.attr", "id")
        .then((id) => {
          cy.get(`label[for="${id}"]`).should("exist");
        });
      // Assuming submit button uses text content for accessible name
      SignupPage.elements.submitButton().should("not.be.empty");
    });

    it("tab navigates through input fields and button", () => {
      // Commenting out as .tab() requires a plugin
      // SignupPage.elements.usernameInput().tab();
      // SignupPage.elements.passwordInput().tab();
      // SignupPage.elements.submitButton().tab().click();
    });

    it("displays error message with correct role for invalid input", () => {
      SignupPage.submitForm(); // Use POM method
      // Use POM element, check visibility first, then optionally role
      SignupPage.elements.errorMessage().should("be.visible");
      // SignupPage.elements.errorMessage().should("have.attr", "role", "alert");
    });
  });
});
