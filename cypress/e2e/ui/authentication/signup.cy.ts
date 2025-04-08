import { LoginPage } from "../../../pages/authentication/loginPage";
import {
  SignupMessages,
  SignupPage,
} from "../../../pages/authentication/signupPage";

const pageElements = SignupPage.elements;

// @ts-ignore
describe("[AuthTeam] Signup Page Functionality [functional]", () => {
  let messages: SignupMessages;
  const randomNumber = Math.floor(Math.random() * 1000000);

  const newUserData = {
    username: `newUser${randomNumber}`,
    email: `newUser${randomNumber}@example.com`,
    password: "ValidPassword123!",
  };

  const duplicateEmailUserData = {
    username: "unusedusername",
    email: newUserData.email,
    password: newUserData.password,
  };

  const shortPasswordData = {
    username: duplicateEmailUserData.username,
    email: newUserData.email,
    password: "pass",
  };

  before(() => {
    cy.fixture("authentication/signupMessages").then((loadedMessages) => {
      messages = loadedMessages.signup;
    });
  });

  beforeEach(() => {
    // @ts-ignore
    cy.logoutByApi();
    SignupPage.visit();
  });

  context("When Signing Up with Valid Credentials", () => {
    it("creates a new account with valid data", () => {
      SignupPage.fillForm(newUserData);
      SignupPage.submitForm();

      pageElements.successDialogueHeading(messages).should("be.visible");
      pageElements.successDialogueContent(messages).should("be.visible");

      cy.get("button").contains("Close").click({ force: true });
      cy.url().should("contain", LoginPage.url);
    });
  });

  context("Form Validations and Errors", () => {
    it("displays errors for missing required fields", () => {
      SignupPage.submitForm();

      SignupPage.usernameRequired(messages).should("exist");
      SignupPage.emailRequired(messages).should("exist");
      SignupPage.passwordRequired(messages).should("exist");
    });

    it("shows error for duplicate email", () => {
      SignupPage.fillForm(duplicateEmailUserData);
      SignupPage.submitForm();

      SignupPage.emailExists(messages).should("be.visible");
    });

    it("enforces password strength requirements", () => {
      SignupPage.fillForm(shortPasswordData);
      SignupPage.submitForm();

      SignupPage.shortPasswordError(messages).should("be.visible");
    });
  });

  context("Input Field Behavior", () => {
    it("shows password visibility toggle", () => {
      pageElements.passwordInput().should("have.attr", "type", "password");
      SignupPage.togglePasswordVisibility();
      pageElements.passwordInput().should("have.attr", "type", "text");
      SignupPage.togglePasswordVisibility();
      pageElements.passwordInput().should("have.attr", "type", "password");
    });
  });
});
