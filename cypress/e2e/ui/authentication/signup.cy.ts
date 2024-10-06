describe("Signup Page Functionality", () => {
  const newUsername = "newUser";
  const newUserEmail = "newUser@example.com";
  const newUserPassword = "ValidPassword123!";
  const registeredUserEmail = Cypress.env("userEmail");
  const signUpCompleteHeading = "Sign Up Complete";
  const signUpCompleteMessage =
    "Signup complete! Please check your email for the account verification link.";
  const unusedUsername = "unusedusername";
  const emailAlreadyRegistered = "Email already registered";
  const passwordLengthError = "Must be at least 8 characters";

  const usernameInput = 'input[name="username"]';
  const emailInput = 'input[name="email"]';
  const passwordInput = 'input[name="password"]';
  const submitButton = 'button[type="submit"]';
  const successDialogueHeading = "h2";
  const successDialogueContent = "span";
  const destructiveText = "p.text-destructive";
  const requiredText = "Required";
  const passwordVisibilityToggle = 'button[title="Show password"]';

  beforeEach(() => {
    // @ts-ignore
    cy.logoutByApi();
    cy.visit("/signup");
  });

  context("When Signing Up with Valid Credentials", () => {
    it("creates a new account with valid data", () => {
      cy.get(usernameInput).type(newUsername);
      cy.get(emailInput).type(newUserEmail);
      cy.get(passwordInput).type(newUserPassword);
      cy.get(submitButton).click();

      cy.get(successDialogueHeading)
        .contains(signUpCompleteHeading)
        .should("be.visible");
      cy.get(successDialogueContent)
        .contains(signUpCompleteMessage)
        .should("be.visible");

      cy.get("button").contains("Close").click({ force: true });

      cy.url().should("contain", "/login");
    });
  });

  context("Form Validations and Errors", () => {
    it("displays errors for missing required fields", () => {
      cy.get(submitButton).click();

      cy.get(usernameInput)
        .parent()
        .find(destructiveText)
        .should("have.text", requiredText);

      cy.get(emailInput)
        .parent()
        .find(destructiveText)
        .should("have.text", requiredText);

      cy.get(passwordInput)
        .parent()
        .parent()
        .find(destructiveText)
        .should("have.text", requiredText);
    });

    it("shows error for duplicate email", () => {
      cy.get(usernameInput).type(unusedUsername);
      cy.get(emailInput).type(registeredUserEmail);
      cy.get(passwordInput).type(newUserPassword);
      cy.get(submitButton).click();

      cy.get("div").contains(emailAlreadyRegistered).should("be.visible");
    });

    it("enforces password strength requirements", () => {
      cy.get(passwordInput).type("pass");
      cy.get(submitButton).click();

      cy.get(passwordInput)
        .parent()
        .parent()
        .find(destructiveText)
        .should("have.text", passwordLengthError);
    });
  });

  context("Input Field Behavior", () => {
    it("shows password visibility toggle", () => {
      cy.get(passwordInput).should("have.attr", "type", "password");

      cy.get(passwordVisibilityToggle).click();

      cy.get(passwordInput).should("have.attr", "type", "text");
    });
  });
});
