# Missing Features & Best Practices

This document lists potentially missing user features, infrastructure improvements, or best practices commonly found in social applications, based on the review of the Decibel Tribe codebase.

## User-Facing Features

- **Password Reset Flow (Token-Based):** While a "Forgot Password?" link exists on the login page, it currently leads to a form (`/forgot-pass`) that only resends the _email verification_ link, not a password reset link. The standard flow (requesting a reset, receiving a tokenized email link, setting a new password via that link) appears to be missing. Functionality exists for logged-in users to _change_ their password if they know the current one.
- **Post Editing:** Although `PostMoreButton` exists for authors, the actual editing functionality/UI wasn't explicitly confirmed in the reviewed files.
- **Post Deletion Confirmation:** While deletion is likely possible via `PostMoreButton`, confirmation dialogs are a best practice to prevent accidental deletion.
- **Comment Editing/Deletion:** Functionality for users to edit or delete their own comments wasn't explicitly seen.
- **Comment Replies (Threading):** The current comment system (`src/components/comments/Comments.tsx` - not fully reviewed) might be flat; threaded replies enhance conversations.
- **Content Reporting/Moderation:** No clear mechanism for users to report inappropriate posts, comments, or users was identified. Admin/moderation tools also seem absent from the reviewed code.
- **User Blocking:** Ability for users to block other users from interacting with them.
- **Muting Users/Topics:** Ability to hide content from specific users or about certain topics without unfollowing/blocking.
- **Profile Customization (Advanced):** Beyond basic info, options like profile headers/banners, pinning posts, etc.
- **Follow Requests (Private Accounts):** No indication of private accounts or a follow request system was seen.
- **Tagging Users in Posts/Comments:** Using `@mentions` to tag other users.
- **Hashtags:** Support for `#hashtags` for content discovery.
- **Real-time Feed Updates:** While chat is real-time, feeds might rely on manual refresh or polling rather than real-time updates (e.g., via WebSockets or SSE) for new posts/likes/comments.
- **Sharing Posts:** Functionality to share posts (internally or externally).
- **Accessibility (A11y):** While difficult to assess fully without running the app, explicit focus on ARIA attributes, keyboard navigation, and screen reader support wasn't prominent in the reviewed component code. Shadcn UI helps, but custom components need attention.
- **Push Notifications:** While web notifications exist, integration with native push notification services (e.g., for mobile apps or PWAs) wasn't seen.
- **Event Creation (UI):** The event creation form exists at `/events/edit`, but no clear UI element (e.g., a "Create Event" button in the main navigation or events page) was seen to _initiate_ the creation flow easily, apart from the link on the Calendar page.

## Infrastructure & Technical Practices

- **Rate Limiting:** API endpoints might lack rate limiting, potentially leading to abuse.
- **Input Sanitization/Validation (Backend):** While frontend validation exists (Zod), robust server-side validation and sanitization on API endpoints is crucial for security.
- **Error Monitoring/Reporting:** Integration with services like Sentry or Datadog for centralized error tracking.
- **Comprehensive API Documentation:** Tools like Swagger/OpenAPI for documenting the backend API.
- **Analytics:** Integration with analytics platforms (e.g., Google Analytics, Plausible, Mixpanel).
- **Image/Video Optimization:** While uploads are handled, advanced optimization (e.g., format conversion, resizing, CDN delivery) wasn't explicitly confirmed and is crucial for performance.
- **Security Headers:** Implementation of standard security headers (CSP, HSTS, X-Frame-Options, etc.) - often handled by hosting platforms like Vercel but worth verifying.
- **Dependency Auditing:** Regular checks for vulnerable dependencies (e.g., `npm audit`).
