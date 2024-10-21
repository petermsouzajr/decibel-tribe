import { LoginMessages } from "../../../pages/authentication/loginPage";

describe.only("Login API Functionality", () => {
  let messages: LoginMessages;

  const validUsername = Cypress.env("verifiedUsername");
  const validPassword = Cypress.env("password");
  const invalidUsername = "invalidUser";
  const invalidPassword = "invalidPass";

  before(() => {
    cy.fixture("authentication/loginMessages").then((loadedMessages) => {
      messages = loadedMessages.login;
    });
  });

  context("Successful Login Request", () => {
    it("should return a success response with session token for valid credentials", () => {
      cy.request("POST", "/api/auth/login", {
        username: validUsername,
        password: validPassword,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("sessionCookie");
      });
    });
  });

  context("Unsuccessful Login Request with Invalid Username", () => {
    it("should return a 401 error for invalid username", () => {
      cy.request({
        method: "POST",
        url: "/api/auth/login",
        body: { username: invalidUsername, password: validPassword },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.error).to.eq(
          messages.validationMessages.invalidCredentials,
        );
      });
    });
  });

  context("Unsuccessful Login Request with Invalid Password", () => {
    it("should return a 401 error for invalid password", () => {
      cy.request({
        method: "POST",
        url: "/api/auth/login",
        body: { username: validUsername, password: invalidPassword },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.error).to.eq(
          messages.validationMessages.invalidCredentials,
        );
      });
    });
  });
});
