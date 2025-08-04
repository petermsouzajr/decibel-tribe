describe("Delete Account", () => {
  beforeEach(() => {
    // Login as a test user
    cy.login("testuser", "password123");
  });

  it("should show delete account option in user dropdown", () => {
    cy.visit("/");
    
    // Click on user avatar to open dropdown
    cy.get('[data-testid="user-avatar"]').click();
    
    // Should see delete account option
    cy.contains("Delete Account").should("be.visible");
  });

  it("should open delete account dialog when clicked", () => {
    cy.visit("/");
    
    // Click on user avatar to open dropdown
    cy.get('[data-testid="user-avatar"]').click();
    
    // Click delete account option
    cy.contains("Delete Account").click();
    
    // Should see the dialog
    cy.contains("Delete Account").should("be.visible");
    cy.contains("This action cannot be undone").should("be.visible");
  });

  it("should show warning step first", () => {
    cy.visit("/");
    
    // Open delete account dialog
    cy.get('[data-testid="user-avatar"]').click();
    cy.contains("Delete Account").click();
    
    // Should be on warning step
    cy.contains("What happens when you delete your account:").should("be.visible");
    cy.contains("Export My Data First").should("be.visible");
    cy.contains("Continue to Delete Account").should("be.visible");
  });

  it("should allow data export", () => {
    cy.visit("/");
    
    // Open delete account dialog
    cy.get('[data-testid="user-avatar"]').click();
    cy.contains("Delete Account").click();
    
    // Click export data button
    cy.contains("Export My Data First").click();
    
    // Should show success message
    cy.contains("Data exported successfully").should("be.visible");
  });

  it("should proceed to confirmation step", () => {
    cy.visit("/");
    
    // Open delete account dialog
    cy.get('[data-testid="user-avatar"]').click();
    cy.contains("Delete Account").click();
    
    // Click continue to proceed to confirmation
    cy.contains("Continue to Delete Account").click();
    
    // Should be on confirmation step
    cy.contains("Please confirm your password").should("be.visible");
    cy.get('input[type="password"]').should("be.visible");
    cy.get('input[type="checkbox"]').should("be.visible");
  });

  it("should require password and confirmation", () => {
    cy.visit("/");
    
    // Open delete account dialog and proceed to confirmation
    cy.get('[data-testid="user-avatar"]').click();
    cy.contains("Delete Account").click();
    cy.contains("Continue to Delete Account").click();
    
    // Try to delete without password
    cy.contains("Delete Account").click();
    cy.contains("Password is required").should("be.visible");
    
    // Enter password but no confirmation
    cy.get('input[type="password"]').type("password123");
    cy.contains("Delete Account").click();
    cy.contains("Confirmation required").should("be.visible");
  });

  it("should allow going back from confirmation to warning", () => {
    cy.visit("/");
    
    // Open delete account dialog and proceed to confirmation
    cy.get('[data-testid="user-avatar"]').click();
    cy.contains("Delete Account").click();
    cy.contains("Continue to Delete Account").click();
    
    // Go back
    cy.contains("Back").click();
    
    // Should be back on warning step
    cy.contains("What happens when you delete your account:").should("be.visible");
  });

  it("should close dialog when clicking outside", () => {
    cy.visit("/");
    
    // Open delete account dialog
    cy.get('[data-testid="user-avatar"]').click();
    cy.contains("Delete Account").click();
    
    // Click outside dialog
    cy.get("body").click(0, 0);
    
    // Dialog should be closed
    cy.contains("Delete Account").should("not.exist");
  });

  it("should show error for invalid password", () => {
    cy.visit("/");
    
    // Open delete account dialog and proceed to confirmation
    cy.get('[data-testid="user-avatar"]').click();
    cy.contains("Delete Account").click();
    cy.contains("Continue to Delete Account").click();
    
    // Enter wrong password and confirm
    cy.get('input[type="password"]').type("wrongpassword");
    cy.get('input[type="checkbox"]').check();
    cy.contains("Delete Account").click();
    
    // Should show error
    cy.contains("Invalid password").should("be.visible");
  });

  it("should successfully delete account with correct password", () => {
    cy.visit("/");
    
    // Open delete account dialog and proceed to confirmation
    cy.get('[data-testid="user-avatar"]').click();
    cy.contains("Delete Account").click();
    cy.contains("Continue to Delete Account").click();
    
    // Enter correct password and confirm
    cy.get('input[type="password"]').type("password123");
    cy.get('input[type="checkbox"]').check();
    cy.contains("Delete Account").click();
    
    // Should show success and redirect to login
    cy.contains("Account deleted successfully").should("be.visible");
    cy.url().should("include", "/login");
  });
}); 