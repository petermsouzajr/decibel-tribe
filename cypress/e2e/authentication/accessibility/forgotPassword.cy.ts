import {
  ForgotPasswordMessages,
  ForgotPasswordPage,
} from "../../../pages/authentication/forgotPasswordPage";

const pageElements = ForgotPasswordPage.elements;

describe("Forgot Password Page Accessibility", () => {
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
        .should(
          "have.attr",
          "aria-label",
          messages.accessibilityMessages.credentialInputLabel,
        );
    });

    it("should have an accessible label for the submit button", () => {
      pageElements
        .submitButton()
        .should(
          "have.attr",
          "aria-label",
          messages.accessibilityMessages.submitButtonLabel,
        );
    });

    it("should focus on the credential input when the page loads", () => {
      pageElements.credentialInput().should("have.focus");
    });

    it("should navigate to submit button when tabbing through inputs", () => {
      // @ts-ignore
      pageElements.credentialInput().tab();
      pageElements.submitButton().should("have.focus");
    });

    it("should have error messages with role='alert'", () => {
      ForgotPasswordPage.fillForm(invalidUser);
      ForgotPasswordPage.submitForm();

      cy.get('[role="alert"]').should("be.visible");
    });
  });
});
