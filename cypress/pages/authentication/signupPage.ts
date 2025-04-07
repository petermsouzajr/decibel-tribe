interface SuccessMessages {
  signUpCompleteHeading: string;
  signUpCompleteMessage: string;
}

interface ValidationMessages {
  emailAlreadyRegistered: string;
  passwordLengthError: string;
  required: string;
}

export interface SignupMessages {
  successMessages: SuccessMessages;
  validationMessages: ValidationMessages;
}

export const SignupPage = {
  url: "/signup",
  elements: {
    usernameInput: () => cy.get('input[name="username"]'),
    emailInput: () => cy.get('input[name="email"]'),
    passwordInput: () => cy.get('input[name="password"]'),
    submitButton: () => cy.get('button[type="submit"]'),
    errorMessage: () => cy.get("p.text-destructive"),
    successDialogueHeading: (messages: SignupMessages) =>
      cy.get("h2").contains(messages.successMessages.signUpCompleteHeading),
    successDialogueContent: (messages: SignupMessages) =>
      cy.get("span").contains(messages.successMessages.signUpCompleteMessage),
    showPasswordToggle: () => cy.get('button[title="Show password"]'),
    hidePasswordToggle: () => cy.get('button[title="Hide password"]'),
    destructiveText: () => cy.get("p.text-destructive"),
    closeButton: () => cy.get('button:contains("Close")'),
  },

  visit(): void {
    cy.visit(this.url);
  },

  fillForm(data: { username: string; email: string; password: string }): void {
    const { username, email, password } = data;
    this.elements.usernameInput().type(username);
    this.elements.emailInput().type(email);
    this.elements.passwordInput().type(password);
  },

  submitForm(): void {
    this.elements.submitButton().click();
  },

  togglePasswordVisibility(): void {
    this.elements
      .showPasswordToggle()
      .should(() => {})
      .then(($el) => {
        if ($el && $el.length) {
          cy.wrap($el).click();
        } else {
          this.elements.hidePasswordToggle().click();
        }
      });
  },

  emailExists(messages: SignupMessages): Cypress.Chainable {
    return cy
      .get("div")
      .contains(messages.validationMessages.emailAlreadyRegistered);
  },

  shortPasswordError(messages: SignupMessages): Cypress.Chainable {
    return cy
      .get("p.text-destructive")
      .contains(messages.validationMessages.passwordLengthError);
  },

  usernameRequired(messages: SignupMessages): Cypress.Chainable {
    return this.elements
      .usernameInput()
      .parent()
      .find("p.text-destructive")
      .contains(messages.validationMessages.required);
  },

  emailRequired(messages: SignupMessages): Cypress.Chainable {
    return this.elements
      .usernameInput()
      .parent()
      .find("p.text-destructive")
      .contains(messages.validationMessages.required);
  },

  passwordRequired(messages: SignupMessages): Cypress.Chainable {
    return this.elements
      .usernameInput()
      .parent()
      .parent()
      .find("p.text-destructive")
      .contains(messages.validationMessages.required);
  },
};
