interface ValidationMessages {
  userNotFound: string;
}

interface SuccessMessages {
  emailSent: string;
}

interface AccessibilityMessages {
  credentialInputLabel: string;
  submitButtonLabel: string;
}

interface ApiMessages {
  successResponse: string;
  errorResponse: string;
}
export interface ForgotPasswordMessages {
  successMessages: SuccessMessages;
  validationMessages: ValidationMessages;
  accessibilityMessages: AccessibilityMessages;
  apiMessages: ApiMessages;
}

export const ForgotPasswordPage = {
  url: "/forgot-pass",
  elements: {
    credentialInput: () => cy.get('input[name="credential"]'),
    submitButton: () => cy.get('button[type="submit"]'),
    successMessage: (messages: ForgotPasswordMessages, credential: string) =>
      cy
        .get("p")
        .contains(`${messages.successMessages.emailSent} ${credential}`),
    errorMessage: (messages: ForgotPasswordMessages) =>
      cy.get("div").contains(messages.validationMessages.userNotFound),
  },

  visit(): void {
    cy.visit(this.url);
  },

  fillForm(credential: string): void {
    this.elements.credentialInput().type(credential);
  },

  submitForm(): void {
    this.elements.submitButton().click();
  },
};
