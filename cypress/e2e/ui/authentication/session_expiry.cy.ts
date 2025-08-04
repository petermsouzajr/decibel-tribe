// Assumes session expiry is configured server-side
// Might require manipulating time or specific API setup

import { LoginPage } from "../../../pages/authentication/loginPage";

describe("[AuthTeam] Authentication - Session Expiry [functional]", () => {
  // Use the default username from the login command for consistency
  const testUsername = "testUser2@test.com";

  beforeEach(() => {
    // @ts-ignore
    cy.loginViaUi(); // Login as the user using UI flow
    cy.visit("/");
    // Ensure login is complete by checking for a logged-in element
    cy.get('button[aria-haspopup="menu"]').should("be.visible"); // Example: check for menu button
  });

  it("should redirect to login when session expires and user tries to navigate to a protected route", () => {
    // Simulate session expiry by clearing the correct session cookie
    cy.clearCookie("auth_session"); // Use the correct cookie name
    cy.clearLocalStorage(); // Also clear local storage just in case

    // Attempt to visit the user's own profile page (should be protected)
    // Use the correct URL structure /users/[username]
    cy.visit(`/users/${testUsername}`, { failOnStatusCode: false });

    // Assert redirection to login page
    cy.url().should("include", LoginPage.url); // Use LoginPage URL
    LoginPage.elements.usernameInput().should("be.visible"); // Check for login element
  });
});
