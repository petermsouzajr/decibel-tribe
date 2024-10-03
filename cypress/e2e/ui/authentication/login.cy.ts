describe("Login Page Functionality", () => {
  const validUsername = Cypress.env("username");
  const validPassword = Cypress.env("password");
  const invalidUsername = "invalidUser";
  const invalidPassword = "invalidPass";
  const errorMessage = "Incorrect username or password";
  const headerTitle = "Tribe";

  beforeEach(() => {
    // @ts-ignore
    cy.logoutByApi();
    cy.visit("/login");
  });

  context("When Logging In With Valid Credentials", () => {
    it("logs in successfully with valid credentials", () => {
      cy.get('input[name="username"]').type(validUsername);
      cy.get('input[name="password"]').type(validPassword);
      cy.get('button[type="submit"]').click();

      cy.get("a").contains(headerTitle).should("be.visible");
      cy.url().should("eq", Cypress.config("baseUrl"));
    });
  });

  context("When Logging In With Invalid Credentials", () => {
    it("displays an error message when using invalid credentials", () => {
      cy.get('input[name="username"]').type(invalidUsername);
      cy.get('input[name="password"]').type(invalidPassword);
      cy.get('button[type="submit"]').click();

      cy.get("div").contains(errorMessage).should("be.visible");
    });
  });
});
