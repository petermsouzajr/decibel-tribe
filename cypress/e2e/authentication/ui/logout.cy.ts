describe("The Logout Functionality", () => {
  beforeEach(() => {
    // @ts-ignore
    cy.loginByApi();
    cy.visit("/");
  });

  it("should logout successfully", () => {
    cy.get("button[aria-haspopup='menu']").click();
    cy.get("div").contains("Logout").click();
    cy.url().should("include", "/login");
  });
});
