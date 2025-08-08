# Project Team Structure and Responsibilities

## Introduction

To streamline development, improve focus, and facilitate ownership, the project is organized into distinct feature teams. Each team is responsible for the end-to-end development, testing, and maintenance of a specific set of application features. Teams should focus on their designated areas and coordinate through defined interfaces or APIs when features interact.

## Team Definitions

### 1. AuthTeam (`[AuthTeam]`)

This team handles user identity, access control, core profile data, and account settings.

**Responsibilities:**

- User Registration (Signup), Login (Email/Password, Google OAuth)
- Password Management (Forgot/Reset Password)
- Email Verification Process
- Session Management (Lucia integration, Session Provider - _Coordination with [PlatformTeam]_)
- Core User Profile Data (Fetching and updating username, displayName, bio, avatar)
- User Account Settings (Password changes, Email changes, Preferences)
- Authentication-related Server Actions and API routes.

### 2. SocialTeam (`[SocialTeam]`)

This team focuses on content creation, discovery (feeds, search), and core social interactions.

**Responsibilities:**

- Post Creation, Editing, and Deletion (Text, Media - _Coordination with [MediaTeam]_)
- Post Feeds (e.g., "For You", "Following", User-specific feeds)
- Viewing Single Post Details
- User Following/Unfollowing System
- Bookmarking Posts
- Content Search (Posts, Users, Events, Groups)
- Post Component Rendering and Interactions (Likes, Comments - _Coordination with [NotificationsTeam]_)

### 3. EventsTeam (`[EventsTeam]`)

This team manages event creation, discovery, and the calendar interface.

**Responsibilities:**

- Event Creation and Editing (Forms, Server Actions)
- Viewing Single Event Details
- Event Listing and Discovery Mechanisms
- Calendar Component Implementation and Display Logic
- Integration with User Preferences for Calendar Visibility
- Event-related Search Functionality (_Refine: Focus on event-specific filters/display, core search logic owned by [SocialTeam]_)

### 4. GroupsTeam (`[GroupsTeam]`)

This team handles the functionality related to user groups.

**Responsibilities:**

- Group Creation and Management
- Viewing Group Pages and Details
- Group Membership Management (Joining, Roles, Invites)
- Displaying Posts within a Group Context (_Coordination with [SocialTeam]_)
- Group-related Search Functionality (_Refine: Focus on group-specific filters/display_)

### 5. MessagingTeam (`[MessagingTeam]`)

This team focuses on the real-time user-to-user communication features.

**Responsibilities:**

- Integration with Stream Chat SDK
- Displaying Chat Lists and Conversations
- Sending and Receiving Messages
- Starting New Conversations / Chats
- User Presence Indicators within Chat

### 6. NotificationsTeam (`[NotificationsTeam]`)

This team is responsible for the user notification system.

**Responsibilities:**

- Displaying Notifications to Users (UI Component - _Coordination with [PlatformTeam]_)
- Backend Logic for Generating Notification Events (_Coordination with [SocialTeam], [GroupsTeam], [EventsTeam] etc._)
- Managing Notification States (Read/Unread)
- Real-time notification updates (if applicable).

### 7. MediaTeam (`[MediaTeam]`)

This team handles file uploads, storage, and processing across the application.

**Responsibilities:**

- Integration with Uploadthing or similar upload services.
- API routes for handling uploads (`/api/uploadthing`).
- Storage configuration and management (e.g., S3 buckets).
- Image/Video processing or optimization (if applicable).
- Cleanup of unused uploads (`/api/clear-uploads`).
- Security considerations for file uploads.

### 8. PlatformTeam (`[PlatformTeam]`)

This team owns the core application shell, navigation, shared UI components, build/deployment processes, and cross-cutting concerns.

**Responsibilities:**

- Main application layout (`src/app/(main)/layout.tsx`).
- Core navigation components (Navbar, Menubar, Sidebars).
- Base UI component library / Design system integration.
- Cross-cutting concerns like routing setup, global state management (if applicable beyond session), base styling.
- Session Provider integration and setup (_Coordination with [AuthTeam]_).
- Build configuration, CI/CD pipelines, testing infrastructure setup.
- Shared utility functions/hooks not specific to a feature team.

### 9. AdminTeam (`[AdminTeam]`)

This team owns platform-level administration features, moderation tooling, and policy enforcement.

**Responsibilities:**

- Admin Dashboard UI and data (stats, recent activity)
- Global access control for admin-only areas (route guards, helpers in `src/lib/admin.ts`)
- Abuse Reporting System end-to-end:
  - Report database model and migrations (including relationships to users, posts, comments, groups, events)
  - Report APIs (`/api/reports`, `/api/reports/[reportId]`): creation, listing, pagination, status updates
  - Protections: per-user daily caps, cooldown between reports, duplicate detection
  - Admin reports list and report detail views with moderation actions (status, notes)
- Admin Users/Reports/Settings pages (pagination, filters, integration with real data sources)
- Seed data for moderation scenarios (`prisma/seedModules/adminTeam/reports.ts` and spec tests)
- Policy and configuration surfaces for moderation (e.g., in-memory or DB-backed settings via `/api/admin/settings`)

**Key Code Areas:**

- `src/app/admin/**` (dashboard, reports, users, settings)
- `src/app/api/reports/**`, `src/app/api/admin/settings/route.ts`
- `src/lib/admin.ts` (helpers, guards), `src/lib/reports.ts` (client helpers, if any)
- `src/components/reports/**` (modal, button)
- `prisma/schema.prisma` (Report model and relations), `scripts/add-report-schema.mjs` (safe setup)
- `prisma/seedModules/adminTeam/**` (moderation seed data and tests)

## Collaboration and Boundaries

While features may interact (e.g., a Post belonging to a Group, a User attending an Event), each team owns the primary implementation within their domain. Cross-team dependencies should be handled through clear data contracts, shared utility functions/types (owned by PlatformTeam or agreed upon), or well-defined API interactions. Avoid modifying code primarily owned by another team without consultation.

## Automation Integration: Team Tagging

To support automated testing workflows and metrics specific to each team, a tagging convention is used within test descriptions.

### Tagging Convention

Team names are added within square brackets (e.g., `[TeamName]`) to the description strings of `describe`, `context`, or `it` blocks in test files (Vitest/Cypress). A test or group of tests can be associated with the team responsible for the corresponding feature.

### Example

This example shows the `[SocialTeam]` tag applied to a top-level `describe` block, indicating all tests within this suite belong to the "Social" team (in a hypothetical scenario). The tag could also be placed on inner `context` or specific `it` blocks if granularity is needed. Test case IDs (`[Cxxxx]`) and other tags (`[smoke]`) can coexist.

```javascript
describe("[SocialTeam] Unit test our feed functions", () => {
  context("feeds", () => {
    it("can fetch the 'For You' feed [C3001][smoke]", () => {
      // ...
    });

    it("can like a post [C3005]", () => {
      // ...
    });
  });
});
```

### Usage

These team tags enable several useful automation capabilities:

- **Targeted Test Execution:** Run only the tests relevant to a specific team, useful during development or for focused regression testing (e.g., `npx vitest run -t "[AuthTeam]"` or configuring CI jobs).
- **Code Coverage Metrics:** Filter code coverage reports to show coverage achieved specifically by a team's tests for their owned features.
- **Test Failure Triage:** Quickly identify which team is likely responsible for fixing a failing test in CI/CD pipelines.
- **Quality Dashboards:** Generate reports showing test pass/fail rates or coverage per team.
