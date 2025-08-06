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

---

# Dating Feature Onboarding Plan

## Objective

Create a user-friendly, modal-based onboarding process for the dating feature on the Decibel Tribe web application, accessible at `/dating/onboarding`. The onboarding will guide users through enabling the dating feature, setting up their dating profile, and defining preferences after clicking the "Activate Dating" button. The process will leverage existing schema and components, ensuring seamless integration with the planned dating functionality.

## User Flow Overview

**User Action:** User clicks the "Activate Dating" button (e.g., on the main dashboard or profile page).
**Redirect:** User is navigated to `/dating/onboarding`, where a full-screen modal sequence begins.

**Modal Steps:**
1. **Welcome:** Introduces the dating feature and prompts user to opt-in.
2. **Profile Setup:** Collects dating-specific profile information (bio, age, gender, location).
3. **Photo Upload:** Allows user to upload and manage profile photos.
4. **Preferences:** Sets dating preferences (age range, gender, max distance).
5. **Completion:** Confirms setup and redirects to the main dating "Deck" view (`/dating`).

**Outcome:** User's dating profile is created/updated, preferences are saved, and they're ready to view potential matches.

## Technical Implementation

### 1. Route Setup

**Route:** `/dating/onboarding`
**Implementation:** Create a new page at `src/app/(main)/dating/onboarding/page.tsx`.
**Purpose:** Hosts the modal-based onboarding flow, ensuring users complete setup before accessing the dating feature.

**Access Control:**
- Requires authentication (use existing auth middleware).
- Check if the user has already completed onboarding (e.g., `User.datingProfileCompleted` boolean field in the schema). If completed, redirect to `/dating`.

**Framework:** Built with React & Next.js, using Tailwind CSS for styling and Framer Motion for modal animations, consistent with your website's tech stack (React, Next.js, Tailwind CSS, TypeScript).

### 2. Modal Structure

**Component:** `DatingOnboardingModal.tsx` in `src/components/dating/`.

**Behavior:**
- Full-screen modal with a progress indicator (e.g., step 1/5, 2/5, etc.).
- Each step is a distinct modal view with navigation buttons (Next, Back, Skip where applicable).
- Uses Framer Motion for smooth transitions between steps (e.g., slide or fade animations).
- Persists user input temporarily in local state, submitting to the backend only on completion to avoid partial saves.

**Props:**
- `currentStep`: Tracks the active step (1–5).
- `onComplete`: Callback to redirect to `/dating` upon completion.
- `onClose`: Option to exit onboarding (prompts confirmation to avoid data loss).

### 3. Modal Steps Breakdown

#### Step 1: Welcome

**Purpose:** Introduce the dating feature and confirm opt-in.

**Content:**
- Header: "Welcome to Decibel Tribe Dating!"
- Description: Brief overview (e.g., "Connect with like-minded music lovers. Set up your profile to start finding matches!").
- Call-to-Action: Button labeled "Let's Get Started".

**Functionality:**
- Clicking "Let's Get Started" sets a flag (e.g., `User.datingEnabled = true`) via `updateDatingProfile` Server Action.
- Optional "Skip" button redirects to the main site (no data saved).

**UI:** Bold heading, short text, vibrant button styling with Tailwind CSS, and a subtle background animation (Framer Motion).

#### Step 2: Profile Setup

**Purpose:** Collect core dating profile details.

**Content:**
Form fields (via `DatingProfileForm.tsx`, reused from your plan):
- Bio (textarea, max 200 characters).
- Age (number input, 18–100).
- Gender (select: Male, Female, Non-Binary, Other).
- Location (input for zipcode or address, converted to lat/lon on backend).

**Validation:** Real-time feedback (e.g., "Bio too long" or "Age required").

**Functionality:**
- Stores input in local state.
- Submits to `updateDatingProfile` Server Action on "Next" (or temporarily saves for final submission).
- "Back" button returns to Welcome step.

**UI:** Clean form layout, Tailwind-styled inputs, error messages in red, and a progress bar (e.g., 2/5).

#### Step 3: Photo Upload

**Purpose:** Allow users to upload and manage profile photos.

**Content:**
Component: `PhotoManager.tsx` (reused from your plan).

**Features:**
- Upload button (integrates with UploadThing for file handling).
- Preview of uploaded photos (max 5, as per typical dating app standards).
- Option to set a primary photo or delete photos.

**Guidance:** Text like "Upload at least one photo to continue" (minimum 1 photo required).

**Functionality:**
- Uses `uploadDatingPhoto`, `updateDatingPhoto`, and `deleteDatingPhoto` Server Actions.
- Validates at least one photo before allowing "Next".
- "Back" button returns to Profile Setup.

**UI:** Grid layout for photo previews, drag-and-drop support, and clear buttons for actions.

#### Step 4: Preferences

**Purpose:** Set dating preferences to filter potential matches.

**Content:**
Form fields (via `DatingPreferencesForm.tsx`):
- Preferred gender(s) (checkboxes: Male, Female, Non-Binary, Other).
- Age range (two number inputs: minAge, maxAge).
- Max distance (slider: 5–100 km).

**Validation:** Ensure valid ranges (e.g., minAge < maxAge, maxDistance > 0).

**Functionality:**
- Stores input in local state.
- Submits to `updateDatingProfile` Server Action (updates `UserDatingPreferences` model).
- "Back" button returns to Photo Upload.

**UI:** Intuitive form with sliders and checkboxes, Tailwind styling, and progress bar (4/5).

#### Step 5: Completion

**Purpose:** Confirm setup and transition to the dating feature.

**Content:**
- Header: "You're All Set!"
- Message: "Your dating profile is ready. Start exploring matches now!"
- Button: "Find Matches" (redirects to `/dating`).

**Functionality:**
- Submits all collected data (profile, photos, preferences) to the backend via `updateDatingProfile` Server Action.
- Sets `User.datingProfileCompleted = true` to skip onboarding in the future.
- Redirects to `/dating` to view the "Deck" of potential matches.
- "Back" button returns to Preferences.

**UI:** Celebratory design with a checkmark icon, vibrant button, and final progress bar (5/5).

### 4. Backend Integration

**Server Actions (reused from your plan):**
- `updateDatingProfile`: Updates User (bio, age, gender, lat/lon) and UserDatingPreferences (preferred genders, age range, max distance).
- `uploadDatingPhoto`, `updateDatingPhoto`, `deleteDatingPhoto`: Manage UserPhoto records.

**Location Handling:**
- If users input a zipcode or address, use a geocoding API (e.g., Google Maps Geocoding or OpenStreetMap) to convert to lat/lon for storage in `User.latitude` and `User.longitude`.
- Cache results to minimize API calls (optional optimization).

**Validation:**
- Ensure all required fields (bio, age, gender, at least one photo) are provided before allowing completion.
- Validate preferences (e.g., minAge ≥ 18, maxDistance ≤ 100 km).

### 5. Frontend Implementation Details

**Component Structure (`src/components/dating/DatingOnboardingModal.tsx`):**
- Uses React `useState` for managing current step and form data.
- Conditionally renders each step's content based on `currentStep`.
- Framer Motion for animations (e.g., `AnimatePresence` for step transitions).
- Tailwind CSS for responsive, modern styling (e.g., `bg-white rounded-lg p-6 max-w-md mx-auto`).

**Navigation:**
- "Next" button advances to the next step, validating input where needed.
- "Back" button returns to the previous step, preserving input.
- "Skip" (Welcome step only) or "Cancel" prompts a confirmation modal to avoid losing progress.

**Progress Indicator:** A horizontal progress bar or step dots (e.g., `w-1/5 bg-blue-500` for completed steps) to show progress.

### 6. UI/UX Considerations

**Accessibility:** Use ARIA labels (e.g., `aria-label="Onboarding step 1 of 5"`) and keyboard navigation for forms and buttons.

**Responsive Design:** Ensure modals are mobile-friendly (e.g., `max-w-md` for smaller screens).

**Feedback:** Provide real-time validation feedback (e.g., red borders for invalid inputs) and loading states for Server Actions.

**Visual Appeal:** Use Tailwind classes for a clean, modern look (e.g., `bg-gradient-to-r from-blue-500 to-purple-500` for headers) and Framer Motion for subtle animations (e.g., slide-in for modals).

**Error Handling:** Display user-friendly error messages (e.g., "Failed to upload photo. Please try again.") and retry options.

### 7. Integration with Dating Feature

**Post-Onboarding Redirect:** After completion, redirect to `/dating` to display the `PotentialMatchCard.tsx` in the "Deck" view.

**State Management:** Use local state during onboarding, only committing to the backend on the final step to ensure atomic updates.

**Reusability:** Reuse `DatingProfileForm.tsx`, `DatingPreferencesForm.tsx`, and `PhotoManager.tsx` for both onboarding and profile editing (`/dating/profile`).

**Progress Persistence:** If users exit mid-onboarding, prompt to save progress (optional) or restart on next visit.

### 8. Testing--SKIP ALL TESTING

**Unit Tests (Jest):**
- Test `DatingOnboardingModal.tsx` for step transitions and state management.
- Test form validation logic in `DatingProfileForm.tsx` and `DatingPreferencesForm.tsx`.
- Mock Server Actions to ensure proper data submission.

**E2E Tests (Cypress/Playwright, integrated with qa-shadow-report):**
- Simulate the entire onboarding flow, from clicking "Activate Dating" to reaching `/dating`.
- Verify modal navigation, form submissions, and photo uploads.
- Ensure redirects and error handling work as expected.

**Manual Testing:**
- Test on multiple devices (desktop, mobile) for responsiveness.
- Validate geocoding accuracy for location inputs.

### 9. Future Enhancements (Out of Scope)--SKIP ALL

- **Progress Saving:** Allow users to save partial progress and resume later.
- **Tutorials:** Add tooltips or a guided tour for each step.
- **Social Integration:** Option to import photos from social media.
- **Analytics:** Track onboarding completion rates to optimize UX.

## Implementation Notes

**Tech Stack Alignment:** Leverages React, Next.js, TypeScript, Tailwind CSS, and Framer Motion, matching your website's stack.

**Schema Integration:** Uses existing User, UserPhoto, and UserDatingPreferences models from your `prisma/schema.prisma`.

**Security:** Enforce authentication for all Server Actions and validate inputs to prevent invalid data.

**Performance:** Optimize photo uploads with UploadThing and cache geocoding results to reduce API calls.

## Example Modal Component Outline

```tsx
// src/components/dating/DatingOnboardingModal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatingProfileForm from './DatingProfileForm';
import DatingPreferencesForm from './DatingPreferencesForm';
import PhotoManager from './PhotoManager';

interface OnboardingModalProps {
  onComplete: () => void;
  onClose: () => void;
}

const DatingOnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({}); // Temporary state for form inputs

  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handleBack = () => setCurrentStep((prev) => prev - 1);

  const steps = [
    {
      title: 'Welcome to Decibel Tribe Dating!',
      content: (
        <div>
          <p>Connect with music lovers. Let's set up your profile!</p>
          <button onClick={handleNext} className="bg-blue-500 text-white px-4 py-2 rounded">
            Let's Get Started
          </button>
          <button onClick={onClose} className="text-gray-500">Skip</button>
        </div>
      ),
    },
    {
      title: 'Create Your Profile',
      content: <DatingProfileForm onSubmit={(data) => setFormData({ ...formData, profile: data })} />,
    },
    {
      title: 'Add Your Photos',
      content: <PhotoManager onUpload={(photos) => setFormData({ ...formData, photos })} />,
    },
    {
      title: 'Set Your Preferences',
      content: <DatingPreferencesForm onSubmit={(data) => setFormData({ ...formData, preferences: data })} />,
    },
    {
      title: 'You're All Set!',
      content: (
        <div>
          <p>Your dating profile is ready. Start exploring matches now!</p>
          <button onClick={onComplete} className="bg-blue-500 text-white px-4 py-2 rounded">
            Find Matches
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div className="fixed inset-0 bg-white p-6 max-w-md mx-auto rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <AnimatePresence>
        <motion.div key={currentStep} initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: -100 }}>
          <h2 className="text-2xl font-bold">{steps[currentStep - 1].title}</h2>
          {steps[currentStep - 1].content}
          <div className="flex justify-between mt-4">
            {currentStep > 1 && (
              <button onClick={handleBack} className="text-gray-500">Back</button>
            )}
            {currentStep < steps.length && (
              <button onClick={handleNext} className="bg-blue-500 text-white px-4 py-2 rounded">Next</button>
            )}
          </div>
          <div className="flex justify-center mt-4">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full mx-1 ${i < currentStep ? 'bg-blue-500' : 'bg-gray-300'}`} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default DatingOnboardingModal;
```

This plan provides a clear, actionable roadmap for implementing a modal-based onboarding process for the dating feature, integrated with your existing schema and tech stack.
