import {
  ForgotPasswordMessages,
  ForgotPasswordPage,
} from "../../../pages/authentication/forgotPasswordPage";

const pageElements = ForgotPasswordPage.elements;

describe("Forgot Password API Functionality", () => {
  let messages: ForgotPasswordMessages;

  // const apiUrl = `${Cypress.config("apiUrl")}/forgot-password`;
  const apiUrl = `forgot-password`; //repair
  const validEmail = Cypress.env("userEmail");
  const validUsername = Cypress.env("username");
  const invalidCredential = "invalidUser";

  before(() => {
    cy.fixture("authentication/forgotPasswordMessages").then(
      (loadedMessages) => {
        messages = loadedMessages.forgotPassword;
      },
    );
  });

  context("Successful Password Reset Request", () => {
    it("should return a success response for valid email", () => {
      cy.request("POST", apiUrl, { credential: validEmail }).then(
        (response) => {
          expect(response.status).to.eq(200);
          expect(response.body.message).to.include(
            messages.apiMessages.successResponse,
          );
        },
      );
    });

    it("should return a success response for valid username", () => {
      cy.request("POST", apiUrl, { credential: validUsername }).then(
        (response) => {
          expect(response.status).to.eq(200);
          expect(response.body.message).to.include(
            messages.apiMessages.successResponse,
          );
        },
      );
    });
  });

  context("Unsuccessful Password Reset Request", () => {
    it("should return an error response for invalid credential", () => {
      cy.request({
        method: "POST",
        url: apiUrl,
        body: { credential: invalidCredential },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.error).to.include(
          messages.apiMessages.errorResponse,
        );
      });
    });
  });
});
