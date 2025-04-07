# Cypress Test Writing Guide

This guide outlines the conventions and structure for writing Cypress end-to-end (E2E) tests in the Decibel Tribe project. Follow these guidelines to ensure consistency, maintainability, and clarity in our test suite.

## 1. Goal

To create robust, readable, and maintainable E2E tests that verify critical user flows and application features from the user's perspective.

## 2. Core Principles

- **User-Centric:** Tests should mimic real user actions and verify outcomes a user would observe.
- **Isolation:** Tests should be independent and not rely on the state left by previous tests (use `beforeEach` for setup).
- **Readability:** Use clear descriptions for `describe` and `it` blocks. Leverage Page Objects and commands for abstraction.
- **Reliability:** Avoid brittle selectors. Prefer data attributes (`data-testid`) where possible, followed by accessible roles/text, and CSS selectors as a last resort. Avoid `cy.wait(number)`.
- **Maintainability:** Structure tests logically using Page Objects and Commands. Keep tests focused on a single workflow or feature aspect.

## 3. Project Structure

```
cypress/
├── e2e/                    # Contains the actual test spec files (.cy.ts)
│   ├── ui/                 # Tests primarily interacting with the User Interface
│   │   └── [feature_area]/ # Folder per application feature (e.g., authentication, events)
│   │       └── test.cy.ts
│   ├── api/                # Tests interacting directly with APIs (setup, teardown, validation)
│   │   └── [feature_area]/
│   │       └── test.cy.ts
│   └── accessibility/      # Accessibility checks (using axe-core, etc.)
│       └── [feature_area]/
│           └── test.cy.ts
├── factories/              # Test data generation functions (e.g., eventData.ts) - Use for dynamic data
│   └── eventData.ts        # Example: export function generateEventData(overrides?) { ... }
├── fixtures/               # Static test data, primarily text/messages (.json)
│   └── [feature_area]/     # Organized by feature (e.g., authentication)
│       └── messages.json   # Example: { "validation": { "requiredField": "This field is required" } }
├── pages/                  # Page Object Model files (.ts)
│   └── [feature_area]/     # Organized by feature (e.g., authentication)
│       └── pageName.ts     # Example: loginPage.ts
├── screenshots/            # Automatic screenshots on failure (gitignored)
├── support/                # Reusable commands and configuration
│   ├── apiCommands.ts      # Custom commands for *API interactions* (e.g., cy.loginByApi)
│   ├── commands.ts         # Custom commands for *UI interactions* (e.g., cy.fillLoginForm)
│   ├── e2e.ts              # Main support file, imports commands
│   └── cypress.d.ts        # TypeScript definitions for custom commands
├── tsconfig.json           # TypeScript config specific to Cypress tests
└── CYPRESS_TEST_WRITING_GUIDE.md # This file
└── CYPRESS_IMPROVEMENT_PLAN.md   # Overall improvement plan
```

## 4. Key Components & Usage

### a. Test Files (`cypress/e2e/`)

- **Naming:** Use descriptive names ending in `.cy.ts` (e.g., `login_flow.cy.ts`, `create_post.cy.ts`).
- **Location:** Place test files within the appropriate type folder (`ui`, `api`, `accessibility`) and then within a subfolder named after the relevant application feature (e.g., `cypress/e2e/ui/authentication/login_flow.cy.ts`, `cypress/e2e/api/posts/create_post_api.cy.ts`).
- **Structure:**
  - Group tests by specific feature aspect or workflow in `describe` blocks (e.g., `describe('Authentication - UI Login Flow', () => { ... })`).
  - Use `beforeEach` for setup actions common to tests within a `describe` block (e.g., visiting a page, logging in via API, setting up intercepts).
  - Each `it` block should test a specific scenario or assertion (e.g., `it('should display an error for invalid credentials', () => { ... })`).

### b. Page Objects (`cypress/pages/`)

- **Purpose:** Encapsulate element selectors and interaction methods for a specific page or component. Reduces duplication and improves maintainability.
- **Structure:**
  - Create a file per page/major component (e.g., `loginPage.ts`).
  - Organize within feature folders (e.g., `pages/authentication/`).
  - Export an object or class.
  - Include a `url` property if applicable.
  - Define an `elements` object containing functions that return Cypress chains for locating elements (e.g., `usernameInput: () => cy.get(...)`). Pass fixture data (like messages) to element selectors if needed for dynamic text matching.
  - Define methods for common actions on the page (e.g., `visit()`, `fillForm(data)`, `submitForm()`).
- **Usage in Tests:** Import the Page Object and use its elements and methods:

  ```typescript
  import { LoginPage } from "../pages/authentication/loginPage";
  import * as loginMessages from "../fixtures/authentication/loginMessages.json";

  beforeEach(() => {
    LoginPage.visit();
  });

  it("should login successfully", () => {
    LoginPage.fillForm({ username: "testuser", password: "password" });
    LoginPage.submitForm();
    // Assertions
  });

  it("should show error message", () => {
    LoginPage.elements.errorMessage(loginMessages.login).should("be.visible");
  });
  ```

### c. Custom Commands (`cypress/support/`)

- **Purpose:** Create reusable functions for common sequences of actions (UI or API).
- **`commands.ts` (UI Commands):** For sequences of UI interactions (e.g., filling a specific form, performing a common navigation).
  ```typescript
  // Example: cypress/support/commands.ts
  Cypress.Commands.add("fillAddressForm", (addressData) => {
    cy.get('[data-testid="street"]').type(addressData.street);
    cy.get('[data-testid="city"]').type(addressData.city);
    // ...
  });
  ```
- **`apiCommands.ts` (API Commands):** For interacting with the application's API, often used for setup (e.g., logging in, seeding data) to bypass the UI and speed up tests. Use `cy.request()`.
  ```typescript
  // Example: cypress/support/apiCommands.ts
  Cypress.Commands.add("loginByApi", (username, password) => {
    cy.request("POST", "/api/auth/login", { username, password }).then(
      (response) => {
        // Handle setting cookies or session storage based on response
      },
    );
  });
  ```
- **Registration:** Import command files in `cypress/support/e2e.ts`.
- **Typing:** Add type definitions to `cypress/support/cypress.d.ts` for autocompletion.
  ```typescript
  // Example: cypress/support/cypress.d.ts
  declare namespace Cypress {
    interface Chainable {
      loginByApi(username: string, password?: string): Chainable<void>;
      fillAddressForm(addressData: any): Chainable<void>;
    }
  }
  ```

### d. Fixtures (`cypress/fixtures/`)

- **Purpose:** Store static data that is unlikely to change, primarily UI text, validation messages, or simple, reusable payloads. **Avoid using fixtures for dynamic test data.**
- **Structure:** JSON files, organized in feature folders (e.g., `fixtures/authentication/loginMessages.json`).
- **Usage:** Load using `import` or `cy.fixture()`. Often passed into Page Object methods or element selectors.

  ```typescript
  import * as messages from "../fixtures/authentication/loginMessages.json";

  it("should display correct header", () => {
    LoginPage.elements.headerTitle(messages.login).should("be.visible");
  });
  ```

### e. Factories (`cypress/factories/`)

- **Purpose:** Generate dynamic, realistic test data objects required for tests. Use libraries like Faker.js if helpful. This is preferred over fixtures for data that needs to be unique per test run or requires complex generation.
- **Structure:** TypeScript files exporting functions (e.g., `factories/eventData.ts`).

  ```typescript
  // Example: cypress/factories/eventData.ts
  import { faker } from "@faker-js/faker";

  export function generateEventData(overrides = {}) {
    return {
      eventName: faker.music.songName(),
      date: faker.date.future(),
      location: faker.location.city(),
      description: faker.lorem.sentence(),
      ...overrides, // Allow overriding specific fields
    };
  }
  ```

- **Usage:** Import the factory function and call it in your test or `beforeEach` block.

  ```typescript
  import { generateEventData } from "../factories/eventData";

  it("should create a new event", () => {
    const eventData = generateEventData();
    // Use eventData to fill forms or make API requests
  });
  ```

## 5. Writing a New Test Scenario (Example Workflow)

1.  **Identify Feature & Type:** Determine the user flow/feature (e.g., "Event Creation") and the test type (e.g., UI interaction, API check, accessibility scan).
2.  **Locate/Create Page Objects:** (Primarily for UI tests) Find existing Page Objects in `cypress/pages/[feature_area]/` or create new ones.
3.  **Locate/Create Fixtures/Factories:**
    - If static text/messages needed: `cypress/fixtures/[feature_area]/`.
    - If dynamic data needed: `cypress/factories/`.
4.  **Locate/Create Commands:** Identify reusable steps for UI (`commands.ts`) or API (`apiCommands.ts`) commands.
5.  **Create Test File:** Create a new `.cy.ts` file in the correct location: `cypress/e2e/[type]/[feature_area]/your_test_name.cy.ts` (e.g., `cypress/e2e/ui/events/create_event.cy.ts`).
6.  **Write Test:**
    - Import necessary Page Objects, fixtures/factories.
    - Use `describe` and `it` blocks with clear descriptions reflecting the type and feature.
    - Use `beforeEach` for setup.
    - Implement test steps using Page Objects (for UI), direct `cy.request` (for API), `cy.injectAxe`/`cy.checkA11y` (for accessibility), and custom commands.
    - Use generated data from factories or static data from fixtures.
    - Write clear assertions.

## 6. Best Practices Summary

- Prefer API commands (`apiCommands.ts`) for setup (login, data seeding) to speed up tests.
- Use Page Objects (`pages/`) extensively to interact with the UI.
- Use Factories (`factories/`) for dynamic test data generation.
- Use Fixtures (`fixtures/`) for static text/messages.
- Use UI commands (`commands.ts`) for _reusable sequences_ of UI actions.
- Write independent tests using `beforeEach` for setup.
- Use descriptive names and clear assertions.
- Prioritize stable selectors (data-testid > accessible roles/text > CSS).
- Avoid `cy.wait(number)`. Use built-in Cypress retry-ability and assertions on UI changes.
