import {
  LoginPage,
  LoginMessages,
} from "../../../pages/authentication/loginPage";

const pageElements = LoginPage.elements;

describe("Login Page Functionality", () => {
  let messages: LoginMessages;

  const validUserData = {
    username: Cypress.env("username"),
    password: Cypress.env("password"),
  };

  const invalidUsernameData = {
    username: "invalidUsername",
    password: validUserData.password,
  };

  const invalidPasswordData = {
    username: validUserData.username,
    password: "invalidPassword",
  };

  before(() => {
    cy.fixture("login/uiMessages").then((loadedMessages) => {
      messages = loadedMessages.login;
    });
  });

  beforeEach(() => {
    // @ts-ignore
    cy.logoutByApi();
    cy.visit("/login");
  });

  context("When Logging In With Valid Credentials", () => {
    it("logs in successfully with valid credentials", () => {
      LoginPage.fillForm(validUserData);
      LoginPage.submitForm();

      pageElements.headerTitle(messages).should("be.visible");
      cy.url().should("eq", Cypress.config("baseUrl"));
    });
  });

  context("When Logging In With Invalid Credentials", () => {
    it("displays an error message when using unregistered username", () => {
      LoginPage.fillForm(invalidUsernameData);
      LoginPage.submitForm();

      pageElements.errorMessage(messages).should("be.visible");
    });

    it("displays an error message when using incorrect password", () => {
      LoginPage.fillForm(invalidPasswordData);
      LoginPage.submitForm();

      pageElements.errorMessage(messages).should("be.visible");
    });
  });
});
