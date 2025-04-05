# Project Team Structure and Responsibilities

## Introduction

To streamline development, improve focus, and facilitate ownership, the project is organized into distinct feature teams. Each team is responsible for the end-to-end development, testing, and maintenance of a specific set of application features.

It is crucial that teams focus on their designated areas and coordinate through defined interfaces or APIs when features interact, minimizing direct overlap in codebase ownership.

## Team Definitions

### 1. Authentication & User Management Team (`[Auth]`)

This team handles user identity, access control, and core profile data.

**Responsibilities:**

- User Registration (Signup)
- User Login (Email/Password, Google OAuth)
- Password Management (Forgot/Reset Password)
- Email Verification Process
- Session Management (Lucia integration, Session Provider)
- Core User Profile Data (Fetching and updating username, displayName, bio, avatar)
- User Account Settings (Password changes, Email changes)
- Authentication-related Server Actions and API routes
- User Search Functionality

### 2. Core Social & Content Team (`[Social]`)

This team focuses on the primary content creation, discovery, and social interaction features.

**Responsibilities:**

- Post Creation, Editing, and Deletion
- Post Feeds (e.g., "For You", "Following", User-specific feeds)
- Viewing Single Post Details
- User Following/Unfollowing System (including related UI and backend logic)
- Bookmarking Posts
- Content Search (Posts, potentially integrating with User search)
- Post Component Rendering and Interactions

### 3. Events & Calendar Team (`[Events]`)

This team manages event creation, discovery, and the calendar interface.

**Responsibilities:**

- Event Creation and Editing (Forms, Server Actions)
- Viewing Single Event Details
- Event Listing and Discovery Mechanisms
- Calendar Component Implementation and Display Logic
- Integration with User Preferences for Calendar Visibility
- Event-related Search Functionality

### 4. Groups Team (`[Groups]`)

This team handles the functionality related to user groups.

**Responsibilities:**

- Group Creation and Management
- Viewing Group Pages and Details
- Group Membership Management (Joining, Roles, Invites)
- Displaying Posts within a Group Context (May coordinate with `[Social]`)

### 5. Messaging Team (`[Messaging]`)

This team focuses on the real-time user-to-user communication features.

**Responsibilities:**

- Integration with Stream Chat SDK
- Displaying Chat Lists and Conversations
- Sending and Receiving Messages
- Starting New Conversations / Chats
- User Presence Indicators within Chat

### 6. Notifications Team (`[Notifications]`)

This team is responsible for the user notification system.

**Responsibilities:**

- Displaying Notifications to Users
- Backend Logic for Generating Notification Events (May require coordination with other teams)
- Managing Notification States (Read/Unread - if implemented)

## Collaboration and Boundaries

While features may interact (e.g., a Post belonging to a Group, a User attending an Event), each team owns the primary implementation within their domain. Cross-team dependencies should be handled through clear data contracts, shared utility functions/types, or well-defined API interactions. Avoid modifying code primarily owned by another team without consultation.

## Automation Integration: Team Tagging

To support automated testing workflows and metrics specific to each team, a tagging convention is used within test descriptions.

### Tagging Convention

Team names are added within square brackets (e.g., `[TeamName]`) to the description strings of `describe`, `context`, or `it` blocks in test files (Vitest/Cypress). A test or group of tests can be associated with the team responsible for the corresponding feature.

### Example

This example shows the `[Windsor]` tag applied to a top-level `describe` block, indicating all tests within this suite belong to the "Windsor" team (in a hypothetical scenario). The tag could also be placed on inner `context` or specific `it` blocks if granularity is needed. Test case IDs (`[Cxxxx]`) and other tags (`[smoke]`) can coexist.

```javascript
describe("[Windsor] Unit test our math functions", () => {
  context("math", () => {
    it("can add numbers [C2452][smoke]", () => {
      expect(add(1, 2)).to.eq(3);
    });

    it("can subtract numbers [C24534][smoke]", () => {
      expect(subtract(5, 12)).to.eq(-7);
    });

    it("can divide numbers [C2460] [usability]", () => {
      expect(divide(27, 9)).to.eq(3);
    });

    it("can multiply numbers [C2461]", () => {
      expect(multiply(5, 4)).to.eq(20);
    });
  });
});
```

### Usage

These team tags enable several useful automation capabilities:

- **Targeted Test Execution:** Run only the tests relevant to a specific team, useful during development or for focused regression testing (e.g., `npx vitest run -t "[Auth]"` or configuring CI jobs).
- **Code Coverage Metrics:** Filter code coverage reports to show coverage achieved specifically by a team's tests for their owned features.
- **Test Failure Triage:** Quickly identify which team is likely responsible for fixing a failing test in CI/CD pipelines.
- **Quality Dashboards:** Generate reports showing test pass/fail rates or coverage per team.
