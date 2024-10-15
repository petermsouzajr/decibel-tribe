import { LogoutPage } from "../../../pages/authentication/logoutPage";
import { LoginPage } from "../../../pages/authentication/loginPage";

describe("The Logout Functionality", () => {
  beforeEach(() => {
    // @ts-ignore
    cy.loginByApi();
    cy.visit("/");
  });

  it("should logout successfully", () => {
    LogoutPage.openMenu();
    LogoutPage.clickLogout();
    cy.url().should("include", LoginPage.url);
  });
});
