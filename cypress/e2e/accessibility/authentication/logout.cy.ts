import { LogoutPage } from "../../../pages/authentication/logoutPage";
import { LoginPage } from "../../../pages/authentication/loginPage";

describe.skip("[AuthTeam] Logout Page Accessibility [smoke]", () => {
  beforeEach(() => {
    cy.loginByApi("testUserVerified");
    // Perform logout via the UI menu instead of visiting a non-existent page
    LogoutPage.openMenu();
    LogoutPage.clickLogout();
    // Wait for logout action to complete (e.g., URL change)
    cy.url().should("include", LoginPage.url); // Ensure redirection happened
  });

  context("Logout Action Outcome Accessibility", () => {
    it("should redirect to login page after logout", () => {
      // Verification is implicitly done by the beforeEach's final assertion
      // We can add an explicit check for a login page element
      LoginPage.elements.usernameInput().should("be.visible");
    });
  });
});
