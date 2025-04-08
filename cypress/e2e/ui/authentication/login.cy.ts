import {
  LoginPage,
  LoginMessages,
} from "../../../pages/authentication/loginPage";
import { LogoutPage } from "../../../pages/authentication/logoutPage";

const pageElements = LoginPage.elements;
// @ts-ignore
describe("[AuthTeam] Login Page Functionality [smoke]", () => {
  let messages: LoginMessages;

  const validUserData = {
    username: "testUser2@test.com",
    password: "Password1!",
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
    cy.fixture("authentication/loginMessages").then((loadedMessages) => {
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

      cy.url().should("eq", Cypress.config("baseUrl"));
      LogoutPage.elements.menuButton().should("be.visible");
    });
  });

  context("When Logging In With Invalid Credentials", () => {
    it("displays an error message when using unregistered username [C313433]", () => {
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
