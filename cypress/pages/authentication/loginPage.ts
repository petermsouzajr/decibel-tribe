interface LoginValidationMessages {
  invalidCredentials: string;
}

interface UiTexts {
  headerTitle: string;
}

export interface LoginMessages {
  validationMessages: LoginValidationMessages;
  uiTexts: UiTexts;
}

export const LoginPage = {
  url: "/login",

  elements: {
    usernameInput: () => cy.get('input[name="username"]'),
    passwordInput: () => cy.get('input[name="password"]'),
    submitButton: () => cy.get('button[type="submit"]'),
    errorMessage: (messages: LoginMessages) =>
      cy.get("div").contains(messages.validationMessages.invalidCredentials),
    headerTitle: (messages: LoginMessages) =>
      cy.get("a").contains(messages.uiTexts.headerTitle),
  },

  visit(): void {
    cy.visit(this.url);
  },

  fillForm(data: { username: string; password: string }): void {
    const { username, password } = data;
    this.elements.usernameInput().type(username);
    this.elements.passwordInput().type(password);
  },

  submitForm(): void {
    this.elements.submitButton().click();
  },
};
