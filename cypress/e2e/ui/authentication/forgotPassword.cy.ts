describe("Forgot Password Page Functionality", () => {
  const username = Cypress.env("username");
  const userEmail = Cypress.env("userEmail");
  const errorMessage = "User not found";

  beforeEach(() => {
    cy.visit("/forgot-pass");
  });

  context("When Entering Valid Credentials", () => {
    const testCases = [
      {
        credential: userEmail,
        message: `Verification email resent! Check your inbox at ${userEmail}.`,
      },
      {
        credential: username,
        message: `Verification email resent! Check your inbox at ${username}.`,
      },
    ];

    testCases.forEach(({ credential, message }) => {
      it(`displays success message when using valid ${credential.includes("@") ? "email" : "username"}`, () => {
        cy.get('input[name="credential"]').type(credential);
        cy.get('button[type="submit"]').click();
        cy.get("p").contains(message).should("be.visible");
      });
    });
  });

  context("When Entering Invalid Credentials", () => {
    it("displays an error message for invalid email/username", () => {
      cy.get('input[name="credential"]').type("invalidEmail");
      cy.get('button[type="submit"]').click();
      cy.get("p").contains(errorMessage).should("be.visible");
    });
  });
});
