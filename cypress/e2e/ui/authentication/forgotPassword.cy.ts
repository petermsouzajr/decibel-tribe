import {
  ForgotPasswordMessages,
  ForgotPasswordPage,
} from "../../../pages/authentication/forgotPasswordPage";

const pageElements = ForgotPasswordPage.elements;

// @ts-ignore
describe("[AuthTeam] Forgot Password Page Functionality [functional]", () => {
  let messages: ForgotPasswordMessages;

  const validUserEmail = Cypress.env("unverifiedEmail");
  const validUsername = Cypress.env("unverifiedUsername");
  const invalidCredential = "invalidUser";

  before(() => {
    cy.fixture("authentication/forgotPasswordMessages").then(
      (loadedMessages) => {
        messages = loadedMessages.forgotPassword;
      },
    );
  });

  beforeEach(() => {
    // @ts-ignore
    cy.logoutByApi();
    ForgotPasswordPage.visit();
  });

  context("When Entering Valid Credentials", () => {
    it("displays success message when using valid email", () => {
      ForgotPasswordPage.fillForm(validUserEmail);
      ForgotPasswordPage.submitForm();

      pageElements
        .successMessage(messages, validUserEmail)
        .should("be.visible");
    });

    it("displays success message when using valid username", () => {
      ForgotPasswordPage.fillForm(validUsername);
      ForgotPasswordPage.submitForm();

      pageElements.successMessage(messages, validUsername).should("be.visible");
    });
  });

  context("When Entering Invalid Credentials", () => {
    it("displays an error message when using invalid credentials", () => {
      ForgotPasswordPage.fillForm(invalidCredential);
      ForgotPasswordPage.submitForm();

      pageElements.errorMessage(messages).should("be.visible");
    });
  });
});
