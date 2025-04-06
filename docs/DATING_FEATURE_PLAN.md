# Dating Feature Implementation Plan

## 1. Goal

Implement a core dating feature within the existing Decibel Tribe web application. Users should be able to:

- Create/update a dating-specific profile (photos, bio, age, gender, location, preferences).
- View potential matches one by one based on preferences.
- Indicate interest ("Yes" - ✅) or disinterest ("No" - ❌) using buttons.
- Be notified of mutual matches.
- Chat with matched users.

This plan focuses on the foundational elements, assuming fine-tuning and advanced features will follow.

## 2. Schema Review

The existing `prisma/schema.prisma` is well-suited and already contains the necessary models:

- `User`: Holds core profile info including dating-specific fields (age, gender, lat/lon, bio, etc.).
- `UserPhoto`: For managing user profile photos.
- `UserDatingPreferences`: For storing user preferences (age range, distance, gender).
- `Swipe`: To record Yes (LIKE) / No (DISLIKE) decisions.
- `Match`: To record mutual LIKEs between users.
- `Message`: Currently linked to `Match`, suitable for post-match chat.

No major schema additions are required for the core functionality outlined. Minor additions (e.g., `zipcode` on User if needed for display) can be considered later.

## 3. Core User Flow

1.  **Opt-in & Profile Setup:** User enables the dating feature and completes their dating profile (photos, bio, age, gender, etc.).
2.  **Preference Setting:** User defines their dating preferences (age range, distance, gender).
3.  **Viewing Potential Matches ("Deck"):** The app presents potential matches one at a time based on compatibility and preferences.
4.  **Decision Making:** User clicks "Yes" (✅) or "No" (❌) for each presented profile.
5.  **Matching:** If two users mutually indicate "Yes", a `Match` is created.
6.  **Notification:** Users are notified of new matches.
7.  **Chatting:** Matched users can chat with each other.

## 4. Backend Implementation (API Routes / Server Actions)

We will need endpoints/actions to handle the dating logic. Server Actions are suitable for mutations initiated from client components. API Routes might be used if complex queries are needed or if separation is desired.

- **Profile Management:**
  - `PUT /api/dating/profile` or `updateDatingProfile` (Server Action): Updates dating-specific fields on the `User` model (age, gender, bio, location - potentially requiring lat/lon fetching from address/zipcode if not provided directly) and the `UserDatingPreferences` model. Requires authentication.
  - `GET /api/dating/profile`: Retrieves the user's own dating profile data. Requires authentication.
- **Photo Management:**
  - `POST /api/dating/photos` or `uploadDatingPhoto` (Server Action): Handles photo uploads (likely integrating with the existing UploadThing setup), creates `UserPhoto` records. Requires authentication.
  - `PUT /api/dating/photos/:photoId` or `updateDatingPhoto` (Server Action): Sets a photo as primary, potentially reorders. Requires authentication.
  - `DELETE /api/dating/photos/:photoId` or `deleteDatingPhoto` (Server Action): Deletes a `UserPhoto`. Requires authentication.
- **Matching Engine:**
  - `GET /api/dating/potential-matches`: Fetches a batch of potential users to display in the "deck". This is the core matching logic (see Section 6). Requires authentication.
  - `POST /api/dating/decision` or `recordDatingDecision` (Server Action): Records a user's decision ("Yes" or "No") on another user.
    - Input: `targetUserId: string`, `decision: 'LIKE' | 'DISLIKE'`
    - Logic:
      - Create a `Swipe` record with `fromUserId` (current user), `toUserId` (target user), and `direction`.
      - If `decision` is 'LIKE', check if a reciprocal `Swipe` record (LIKE from `targetUserId` to `fromUserId`) exists.
      - If a reciprocal LIKE exists, create a `Match` record for `fromUserId` and `targetUserId`.
      - Trigger a notification for both users if a match is created.
    - Requires authentication.
- **Matches & Chat:**
  - `GET /api/dating/matches`: Fetches the list of users the current user has matched with. Requires authentication.
  - `GET /api/dating/matches/:matchId/messages`: Fetches chat messages for a specific match (pagination needed). Requires authentication and authorization (user must be part of the match).
  - `POST /api/dating/matches/:matchId/messages` or `sendMatchMessage` (Server Action): Creates a new `Message` linked to the `Match`. Requires authentication and authorization.

## 5. Frontend Implementation (Components & Pages)

New UI elements will be needed:

- **Pages:**
  - `src/app/(main)/dating/page.tsx`: Main dating view ("Deck").
  - `src/app/(main)/dating/profile/page.tsx`: Page for editing dating profile and preferences.
  - `src/app/(main)/dating/matches/page.tsx`: Page displaying the list of matches (could also be a sidebar/modal).
  - `src/app/(main)/dating/chat/[matchId]/page.tsx`: Page for displaying the chat with a specific match.
- **Components (`src/components/dating/`):**
  - `DatingOptIn.tsx`: Component/Modal for first-time users to enable the feature.
  - `DatingProfileForm.tsx`: Form for editing profile fields (bio, age, gender, etc.).
  - `DatingPreferencesForm.tsx`: Form for editing preferences.
  - `PhotoManager.tsx`: Component for uploading, viewing, deleting, and setting primary photos. (Leverage existing UploadThing hooks).
  - `PotentialMatchCard.tsx`: Displays a single potential match's profile (photos, name, age, bio, distance).
  - `DecisionButtons.tsx`: Contains the "Yes" (✅) and "No" (❌) buttons, triggers the decision recording action.
  - `MatchList.tsx`: Displays a list of matched users (avatars, names).
  - `ChatInterface.tsx`: Component for displaying messages and the input field for sending messages within a match.

## 6. Matching Logic Details (`GET /api/dating/potential-matches`)

This endpoint needs to:

1.  Identify the current user (`loggedInUserId`).
2.  Fetch the user's `UserDatingPreferences`.
3.  Query the `User` table for potential matches:
    - Filter by the user's `preferredGenders`.
    - Filter by the user's preferred `minAge` and `maxAge`.
    - Filter by the target user's preferences matching the current user (reciprocal preferences - e.g., they must also prefer the current user's gender and age).
    - Filter by distance: Calculate distance based on stored `latitude`/`longitude` and compare against `maxDistanceKm`. Requires a geospatial query function (PostGIS extension in PostgreSQL is ideal, or calculate manually for simpler cases).
    - Exclude users the current user has already created a `Swipe` for.
    - Exclude users the current user has already `Match`ed with.
    - Exclude the current user themselves.
4.  Potentially add ranking/sorting (e.g., by proximity, profile completeness, last active time - deferred for now).
5.  Return a limited batch of user profiles (including photos, bio, age, name, calculated distance).

## 7. Notifications

- Use the existing `Notification` model and system.
- When a `Match` is created in the `recordDatingDecision` logic:
  - Create two `Notification` records:
    - One for `user1Id` with `issuerId = user2Id`, `type = MATCH` (needs adding to `NotificationType` enum).
    - One for `user2Id` with `issuerId = user1Id`, `type = MATCH`.
- The frontend notification system (`Notifications.tsx`, `NotificationsButton.tsx`) should be updated to handle the new `MATCH` type, likely linking to the chat page for that match (`/dating/chat/[matchId]`).

## 8. UI Considerations

- Ensure the "Deck" view presents profiles clearly one at a time.
- Implement the "Yes" (✅) and "No" (❌) buttons prominently. Clicking a button should record the decision and load the next profile.
- Provide clear visual feedback when a match occurs.
- The Matches list should be easily accessible.
- The Chat interface should be clean and functional.

## 9. Future Considerations (Out of Scope for Initial Plan)

- Real-time chat (potentially adapting Stream Chat or using WebSockets).
- Advanced filtering options.
- Profile verification badges.
- User reporting and blocking within the dating context.
- Algorithmic matching improvements.
- Push notifications for new matches/messages.
- "Undo" last decision feature.

This plan provides a detailed roadmap for implementing the core dating functionality leveraging the existing structure and schema.
