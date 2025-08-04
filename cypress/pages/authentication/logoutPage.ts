export const LogoutPage = {
  url: "/",

  elements: {
    menuButton: () => cy.get('button[aria-haspopup="menu"]'),
    logoutOption: () => cy.get("div").contains("Logout"),
    confirmLogoutButton: () => cy.get('button[type="submit"]'),
  },

  visit(): void {
    cy.visit(this.url);
  },

  openMenu(): void {
    this.elements.menuButton().click();
  },

  clickLogout(): void {
    this.elements.logoutOption().click();
  },
};
