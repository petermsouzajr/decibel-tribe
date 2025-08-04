import { LogoutPage } from "../../../pages/authentication/logoutPage";
import { LoginPage } from "../../../pages/authentication/loginPage";

describe("[AuthTeam] The Logout Functionality [smoke]", () => {
  const validUsername = Cypress.env("verifiedUsername");
  beforeEach(() => {
    // @ts-ignore
    cy.loginViaUi();
    cy.visit("/");
  });

  it("should logout successfully", () => {
    LogoutPage.openMenu();
    LogoutPage.clickLogout();
    cy.url().should("include", LoginPage.url);
  });
});
