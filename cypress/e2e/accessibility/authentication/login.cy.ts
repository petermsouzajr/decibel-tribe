import {
  LoginPage,
  LoginMessages,
} from "../../../pages/authentication/loginPage";

// Add hierarchical tags: [TeamName][Category][Type]
describe.skip("[AuthTeam] Login Page Accessibility [sanity]", () => {
  let messages: LoginMessages;

  before(() => {
    // Load messages from fixture
    cy.fixture("authentication/loginMessages").then((loadedMessages) => {
      messages = loadedMessages.login; // Assuming fixture structure { "login": { ... } }
    });
  });

  beforeEach(() => {
    // @ts-ignore
    cy.logoutByApi();
    LoginPage.visit(); // Use page object method
  });

  context("Accessibility Attributes", () => {
    it("has accessible names for username and password fields", () => {
      // Check for associated label via id/for
      LoginPage.elements
        .usernameInput()
        .should("have.attr", "id")
        .then((id) => {
          cy.get(`label[for="${id}"]`).should("exist");
        });
      LoginPage.elements
        .passwordInput()
        .should("have.attr", "id")
        .then((id) => {
          cy.get(`label[for="${id}"]`).should("exist");
        });
      // Assuming submit button uses text content for accessible name
      LoginPage.elements.submitButton().should("not.be.empty");
    });

    it("displays error message correctly for invalid input", () => {
      LoginPage.fillForm({
        username: "invalidUser",
        password: "invalidPassword",
      });
      LoginPage.submitForm();
      // Use page object selector and check visibility
      LoginPage.elements.errorMessage(messages).should("be.visible");
      // Optional: Check role if the actual element *should* have it
      // LoginPage.elements.errorMessage(messages).should("have.attr", "role", "alert");
    });
  });
});
