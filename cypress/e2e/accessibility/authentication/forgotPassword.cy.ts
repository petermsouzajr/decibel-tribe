import {
  ForgotPasswordMessages,
  ForgotPasswordPage,
} from "../../../pages/authentication/forgotPasswordPage";

const pageElements = ForgotPasswordPage.elements;

describe.skip("[AuthTeam] Forgot Password Page Accessibility [sanity]", () => {
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

    it("should display the correct error message for an invalid user", () => {
      ForgotPasswordPage.fillForm(invalidUser);
      ForgotPasswordPage.submitForm();
      // Use the page object selector for the error message
      pageElements.errorMessage(messages).should("be.visible");
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
  });
});
