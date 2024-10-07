describe("Forgot Password Page Functionality", () => {
  const validUsername = Cypress.env("username");
  const validUserEmail = Cypress.env("userEmail");
  const invalidCredential = "invalidUser";
  const errorMessage = "User not found";
  const successMessage = "Verification email sent! Check your inbox at";

  beforeEach(() => {
    cy.visit("/forgot-pass");
  });

  context("When Entering Valid Credentials", () => {
    it("displays success message when using valid email", () => {
      cy.get('input[name="credential"]').type(validUserEmail);
      cy.get('button[type="submit"]').click();

      cy.get("p")
        .contains(`${successMessage} ${validUserEmail}`)
        .should("be.visible");
    });

    it("displays success message when using valid username", () => {
      cy.get('input[name="credential"]').type(validUsername);
      cy.get('button[type="submit"]').click();

      cy.get("p")
        .contains(`${successMessage} ${validUsername}`)
        .should("be.visible");
    });
  });

  context("When Entering Invalid Credentials", () => {
    it("displays an error message when using invalid credentials", () => {
      cy.get('input[name="credential"]').type(invalidCredential);
      cy.get('button[type="submit"]').click();

      cy.get("div").contains(errorMessage).should("be.visible");
    });
  });
});
