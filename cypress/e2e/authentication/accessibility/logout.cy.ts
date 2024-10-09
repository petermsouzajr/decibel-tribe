describe.skip("Logout Page Accessibility", () => {
  beforeEach(() => {
    // @ts-ignore
    cy.loginByApi(); // Assuming user needs to be logged in before visiting logout
    cy.visit("/logout");
  });

  context("Logout Button Accessibility", () => {
    it("focuses on the logout button on load", () => {
      cy.get('button[type="submit"]').focus().should("have.focus");
    });

    it("logout button is visible and styled correctly", () => {
      cy.get('button[type="submit"]')
        .should("be.visible")
        .and("have.css", "color", "expectedColorValue"); // Replace 'expectedColorValue' with actual expected color
    });
  });
});
