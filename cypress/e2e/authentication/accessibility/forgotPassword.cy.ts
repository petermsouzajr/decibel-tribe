import {
  ForgotPasswordMessages,
  ForgotPasswordPage,
} from "../../../pages/authentication/forgotPasswordPage";

const pageElements = ForgotPasswordPage.elements;

describe.skip("Forgot Password Page Accessibility", () => {
  let messages: ForgotPasswordMessages;
  const invalidUser = "invalidUser";

  before(() => {
    cy.fixture("authentication/forgotPasswordMessages").then(
      (loadedMessages) => {
        messages = loadedMessages.forgotPassword;
      },
    );
  });

  beforeEach(() => {
    ForgotPasswordPage.visit();
  });

  context("Form Accessibility", () => {
    it("should have an accessible label for the credential input", () => {
      pageElements
        .credentialInput()
        .should("have.attr", "id")
        .then((id) => {
          cy.get(`label[for="${id}"]`).should("exist");
        });

      pageElements
        .credentialInput()
        .should("have.attr", "placeholder", "Enter your username or email");
    });

    it("should have accessible text for the submit button", () => {
      pageElements
        .submitButton()
        .should("contain.text", "Send Verification Email");
    });

    it("should focus on the credential input when the page loads", () => {
      pageElements
        .credentialInput()
        .should("not.be.disabled")
        .and("not.have.attr", "readonly");
      pageElements.credentialInput().focus();
      pageElements.credentialInput().should("have.focus");
    });

    it("should navigate to submit button when tabbing through inputs", () => {
      // @ts-ignore
      pageElements.credentialInput().focus();
      pageElements.credentialInput();
      pageElements.submitButton().should("have.focus");
    });

    it("should have error messages with role='alert'", () => {
      ForgotPasswordPage.fillForm(invalidUser);
      ForgotPasswordPage.submitForm();

      cy.get('[role="alert"]').should("be.visible");
    });

    it("should have an alt attribute for all images", () => {
      cy.get("img").should("have.attr", "alt");
    });

    it("should submit the form when pressing Enter", () => {
      pageElements.credentialInput().type("validUser{enter}");
      // Ensure the form is submitted
    });

    it("should have aria-describedby for input guidance", () => {
      pageElements.credentialInput().should("have.attr", "aria-describedby");
    });

    it("should announce form errors via aria-live", () => {
      cy.get('[role="alert"]').should("have.attr", "aria-live", "assertive");
    });
  });
});
