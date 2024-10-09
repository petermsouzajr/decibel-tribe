describe.skip("Signup Page Accessibility", () => {
  beforeEach(() => {
    cy.visit("/signup");
  });

  context("Accessibility Attributes", () => {
    it("has aria-labels for username, password fields, and submit button", () => {
      cy.get('input[name="username"]').should(
        "have.attr",
        "aria-label",
        "Username",
      );
      cy.get('input[name="password"]').should(
        "have.attr",
        "aria-label",
        "Password",
      );
      cy.get('button[type="submit"]').should(
        "have.attr",
        "aria-label",
        "Submit",
      );
    });

    it("focuses on username input field on load", () => {
      cy.get('input[name="username"]').should("have.focus");
    });

    it("tab navigates through input fields and button", () => {
      // @ts-ignore
      cy.get('input[name="username"]').tab();
      // @ts-ignore
      cy.get('input[name="password"]').tab();
      // @ts-ignore
      cy.get('button[type="submit"]').tab().click();
    });

    it("displays error message with correct role for invalid input", () => {
      cy.get('button[type="submit"]').click();
      cy.get(".error-message").should("have.attr", "role", "alert");
    });
  });
});
