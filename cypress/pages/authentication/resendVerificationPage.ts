// cypress/pages/authentication/resendVerificationPage.ts
export const ResendVerificationPage = {
  url: "/resend-verification",

  elements: {
    // Assuming the input field is for email
    emailInput: () => cy.get('input[name="email"]'),
    submitButton: () => cy.get('button[type="submit"]'),
    // Add selectors for success/error messages as needed
    successMessage: () => cy.get('[data-testid="success-message"]'), // Placeholder
    errorMessage: () => cy.get('[data-testid="error-message"]'), // Placeholder
  },

  visit(): void {
    cy.visit(this.url);
  },

  fillForm(email: string): void {
    this.elements.emailInput().type(email);
  },

  submitForm(): void {
    this.elements.submitButton().click();
  },
};
