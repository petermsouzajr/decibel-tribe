# Cypress Test Coverage Improvement Plan

## 1. Goal

To establish robust End-to-End (E2E) test coverage using Cypress for the Decibel Tribe application. The focus is on validating critical user workflows from the user's perspective, ensuring major features function correctly across different pages and components after integration.

## 2. Current State Assessment

- Cypress is configured (`cypress.config.ts`).
- Test structure (`cypress/`) including `e2e`, `fixtures`, `pages` (potentially), and `support` directories exists.
- Environment variables for Cypress (`cypress.env.json`) are in use.
- A database seeding script (`prisma/seed.ts`) exists, which can be leveraged for setting up consistent test states.
- Current E2E test coverage might be incomplete or focused on specific areas.

## 3. Testing Strategy & Philosophy

- **User-Centric Scenarios:** Tests should simulate realistic user journeys through the application, covering happy paths and key edge cases for critical features.
- **E2E Scope:** Validate the integration of frontend components, API interactions, routing, and basic state persistence. Avoid testing granular component logic already covered by Vitest unit/integration tests.
- **Network Interaction:** Use `cy.intercept()` to wait for, verify, or stub network requests (API calls to the Next.js backend) to ensure predictable test behavior and assert backend interactions.
- **Test Independence:** Aim for tests that can run independently, setting up their required state and cleaning up afterward where possible. Leverage database seeding and potentially API calls for setup.
- **Readability & Maintainability:** Use clear descriptions (`describe`, `it`), consistent selectors (prefer data attributes like `data-testid`), Page Object Model (POM) or App Actions pattern, and custom commands (`cypress/support/commands.ts`) for common actions (e.g., login).
- **Avoid Fragility:** Minimize reliance on CSS classes or complex selectors prone to breaking. Prefer accessibility attributes or `data-testid`.

## 4. Key User Flows for E2E Test Coverage (Suggested Priority)

1.  **Authentication:**
    - Successful signup using email/password (potentially including email verification step if feasible).
    - Successful login using email/password.
    - Successful login using Google (may require specific setup or mocking).
    - Attempted login with invalid credentials.
    - Logout functionality.
    - Resend Verification Email flow.
2.  **Core Post Workflow:**
    - Create a new text-only post.
    - Create a new post with image/video upload.
    - View the created post on the feed and on its dedicated page.
    - Like/Unlike a post and verify count update (stub network response if needed).
    - Dislike/Undislike a post and verify count update.
    - Bookmark/Unbookmark a post.
    - Add a comment to a post and verify it appears.
    - View bookmarked posts on the Bookmarks page.
3.  **User Profile Workflow:**
    - View own profile.
    - View another user's profile.
    - Follow/Unfollow another user from their profile.
    - Edit own profile information (display name, bio, potentially instruments/skills).
    - Update own email address (requires password).
    - Update own password (requires current password).
4.  **Group Workflow:**
    - Create a new group.
    - View the created group in the Group List.
    - Navigate to the group page.
    - (As Admin/Owner) Invite another user (may require checking state via backend/seed data).
    - (As Invitee) Accept a group invite.
    - Post within a group and verify it appears on the group feed.
    - Leave a group.
    - (As Owner) Delete a group.
5.  **Event Workflow:**
    - Create a new event (Draft and Published).
    - View the created event on the Events page/feed.
    - View event details on its dedicated page.
    - Add event to calendar / Remove event from calendar.
    - Edit an existing event.
6.  **Notification Workflow:**
    - Perform an action that triggers a notification (e.g., follow a user, receive a comment/like on a post).
    - Navigate to the Notifications page and verify the notification appears.
    - Verify the notification links correctly to the relevant content/user.
    - Verify the unread count/indicator updates correctly (may require setup/assertions based on initial state).
7.  **Messaging Workflow (Basic):**
    - Start a new chat with another user.
    - Send a message in the chat.
    - Verify the message appears in the chat window. (Note: Testing real-time updates or complex Stream Chat UI might be challenging/flaky, focus on core actions).
8.  **Search Workflow:**
    - Perform a search for a known user/post and verify results in the correct tab.
    - Perform a search for a known skill/instrument and verify user results.
    - Perform a search for a known event and verify results.
9.  **(Future) Dating Workflow:**
    - Complete dating profile setup.
    - Set dating preferences.
    - View the potential match deck.
    - Perform "Yes" and "No" actions.
    - Trigger a match scenario (requires specific data setup).
    - View the Matches list.
    - Initiate a chat with a match.

## 5. Tooling & Setup Enhancements

- **Review `cypress.config.ts`:** Confirm `baseUrl`, default timeouts, `e2e` spec patterns, viewport settings.
- **Custom Commands (`cypress/support/commands.ts`):** Implement or refine commands for common tasks like:
  - `cy.login(username, password)`
  - `cy.logout()`
  - `cy.createPost(content, options)`
  - `cy.seedDatabase()` (using `cy.exec` or `cy.task`)
  - `cy.cleanupUser(username)`
- **Page Object Model (POM) / App Actions:** Standardize the approach. Define page objects (`cypress/pages/`) or app action functions to encapsulate interactions with specific pages or features, reducing duplication and improving maintainability.
- **Fixtures (`cypress/fixtures/`):** Use for static data needed across multiple tests (e.g., standard text snippets, user profiles for stubbing).
- **Database Seeding Integration:** Develop a robust strategy for using `prisma/seed.ts`:
  - Run seeding before the entire test suite or specific `describe` blocks using `cy.exec` or `cy.task`.
  - Create custom commands or tasks to seed specific scenarios required by tests.
  - Ensure cleanup strategies are in place (either via seeding script options or specific cleanup commands).
- **Network Intercepts (`cy.intercept()`):** Use strategically to:
  - Wait for critical API calls to complete before proceeding (`cy.wait('@alias')`).
  - Assert on request/response payloads.
  - Stub responses to isolate the frontend or test specific UI states (e.g., error states).
- **Flake Reduction:** Actively address test flakiness by using `.should()` assertions, waiting for network requests, ensuring elements are actionable before interacting, and potentially using Cypress retries (built-in or plugin).

## 6. Process & Workflow Integration

1.  **Test Planning:** For new features, plan the corresponding E2E scenarios alongside development.
2.  **CI Integration:** Integrate Cypress tests into the GitHub Actions workflow.
    - Use strategies like `start-server-and-test` to run tests against a locally built application, or run against deployed preview environments.
    - Consider parallel execution (Cypress Cloud or open-source alternatives) to reduce run times.
    - Decide on failure strategy (e.g., fail PR checks if E2E tests fail).
3.  **Maintenance:** Regularly review and update E2E tests as the application UI and workflows change.
4.  **Debugging:** Utilize Cypress Time-Traveling Debugger, screenshots, and videos to diagnose failures.

## 7. Measuring Success

- **Coverage of Critical Paths:** Ensure the most important user journeys are covered by stable E2E tests.
- **Reduced Manual Testing:** Decrease reliance on manual regression testing before releases.
- **Early Bug Detection:** Catch integration issues and regressions automatically in CI.
- **Test Suite Stability:** Track and minimize test flakiness over time.
- **Confidence in Deployment:** Increased team confidence when deploying changes knowing critical flows are verified.

This plan provides a roadmap for enhancing the Cypress E2E test suite, focusing on real user scenarios and maintainability.
