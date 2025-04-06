# Vitest Test Coverage Improvement Plan

## 1. Goal

To achieve comprehensive and meaningful test coverage using Vitest for the Decibel Tribe application, focusing on critical user flows, complex logic, utility functions, and UI components. This aims to increase confidence in code changes, reduce regressions, and improve overall code quality.

## 2. Current State Assessment

- Vitest is configured (`vitest.config.ts`).
- Coverage reporting (`.nyc_output`, `coverage/`) is set up.
- Testing structure (`tests/` directory) likely exists.
- Current test coverage is acknowledged as lacking.
- The project uses Next.js (App Router), TypeScript, React Query, Prisma, Shadcn UI, and Tailwind CSS.

## 3. Testing Strategy & Philosophy

- **Focus on Value:** Prioritize tests that provide the most confidence and cover critical paths or complex logic, rather than aiming solely for a high percentage number on simple code.
- **Unit Tests:** For isolated functions (utils, validation schemas, simple hooks) with minimal dependencies. Mock external calls.
- **Integration Tests:** For components interacting with hooks, context, or services. Use React Testing Library (RTL) to test from the user's perspective. Mock API calls, database interactions (Prisma), authentication (`lucia-auth`), and external services (Stream Chat) at the boundary.
- **Server Components:** Test any complex logic within Server Components directly if possible, or test the data-fetching functions they call. UI testing is less relevant for pure Server Components.
- **React Testing Library (RTL):** Use RTL for component tests, focusing on querying elements accessibly (roles, labels, text) and simulating user interactions (`userEvent`). Avoid testing implementation details.
- **Mocking:** Use Vitest's built-in mocking (`vi.mock`, `vi.fn`, `vi.spyOn`) extensively to isolate units and control test environments. Standardize mocking approaches (e.g., placing mocks in `__mocks__` directories or using `vi.mock` at the top of test files).

## 4. Key Areas for Test Coverage (Suggested Priority)

1.  **Utilities (`src/lib/`)**
    - **Validation Schemas (`validation.ts`):** Test Zod schemas with valid and invalid inputs.
    - **Core Utilities (`utils.ts`):** Test date formatting, data transformations, etc.
    - **API Client (`ky.ts`):** Less critical to unit test the instance itself, focus on code _using_ it.
    - **Type Guards/Helpers (`types.ts`):** Test any complex type logic or helper functions.
2.  **Custom Hooks (`src/hooks/`)**
    - Test state transitions, effects, and return values. Use RTL's `renderHook` if necessary. Mock any external dependencies called within hooks. Example: `useDebounce`, `useMediaUpload`.
3.  **Core Components (`src/components/`)**
    - **Post (`Post.tsx`, `PostEditor.tsx`):** Test rendering based on props (e.g., own post vs other's post), interaction logic (like, dislike, comment, bookmark buttons - mocking mutation hooks), media display, content expansion. Test editor interactions and submission (mocking `useSubmitPostMutation`).
    - **Event (`Event.tsx`, `EventFormPage.tsx`):** Test rendering, attendee button logic (mocking API calls/mutations), edit button visibility. Test form validation, state changes (performers), and submission (mocking mutations).
    - **User Profile (`UserProfilePage.tsx`, `EditProfileButton.tsx`, etc.):** Test rendering of user data, visibility of edit buttons, interaction with modals (mocking dialog components or their triggers).
    - **Authentication Forms (`LoginForm.tsx`, `SignUpForm.tsx`, `ForgotPassForm.tsx`):** Test form rendering, validation (mocking Zod schema results if needed), state updates, submission logic (mocking server actions/API calls).
    - **Notifications (`Notification.tsx`, `Notifications.tsx`):** Test rendering different notification types, mark-as-read logic (mocking mutation).
    - **Groups (`GroupList.tsx`, `CreateGroupModal.tsx`, group page `page.tsx`):** Test list rendering, modal interactions, page logic based on membership/ownership (mocking queries/API calls).
    - **Chat (`Chat.tsx`, `ChatSidebar.tsx`, `NewChatDialog.tsx`):** Mock `stream-chat-react` heavily. Test component rendering, sidebar interactions, dialog logic (user search - mocking client calls).
    - **Shared UI (`UserAvatar.tsx`, `LoadingButton.tsx`, etc.):** Test basic rendering and props variations.
4.  **Backend Logic (Unit/Integration Level)**
    - **Server Actions (`src/app/(auth)/actions.ts`, potentially others):** Unit test the logic within actions, mocking Prisma calls, Lucia auth functions, external services.
    - **API Routes (`src/app/api/`)**: Similar to Server Actions, unit test the handler logic with mocked dependencies. Focus on complex routes like search or data aggregation.
    - **Authentication Helpers (`src/auth.ts`):** Unit test helper functions, mocking underlying Lucia/Prisma calls.
5.  **State Management (`@tanstack/react-query`)**
    - Test components that use `useQuery`, `useMutation`, `useInfiniteQuery`. Mock the return values of these hooks to test how the component behaves in different states (loading, error, success). Alternatively, mock the underlying `ky` fetcher function.

## 5. Tooling & Setup Enhancements

- **Review `vitest.config.ts`:** Ensure optimal configuration:
  - `environment: 'jsdom'` for component tests.
  - Correct aliases (`@/`) are set up.
  - `setupFiles`: Point to a setup file (e.g., `tests/setup.ts`).
  - `globals: true` (optional, but common).
  - Coverage provider (`v8` or `istanbul`).
- **Setup File (`tests/setup.ts`):**
  - Import `@testing-library/jest-dom/extend-expect` for better assertions (e.g., `toBeInTheDocument`).
  - Configure `afterEach(() => cleanup())` from RTL (often handled automatically now, but good to ensure).
  - Implement global mocks if needed (e.g., `matchMedia`, `IntersectionObserver`).
- **Mocking Strategy:**
  - Decide on a consistent mocking approach (e.g., top-level `vi.mock` vs. `__mocks__` folder).
  - Consider utilities for mocking Prisma client (e.g., `prisma-mock` or manual mocking).
  - Mock `next/navigation` functions (`useRouter`, `useSearchParams`) when testing components that use them.
- **Dependencies:** Ensure Vitest, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, etc., are installed and up-to-date.

## 6. Process & Workflow Integration

1.  **New Code:** Require tests for all new features, components, hooks, and utility functions.
2.  **Bug Fixes:** Write regression tests alongside bug fixes to prevent recurrence.
3.  **Refactoring:** Ensure existing tests pass after refactoring, or update tests accordingly. Add tests before significant refactoring if coverage is missing.
4.  **CI Integration:** Configure the existing GitHub Actions workflow to run `npm run test` (or equivalent script) on pushes/pull requests. Fail the build if tests fail.
5.  **Coverage Thresholds (Optional, Gradual):** Consider adding coverage thresholds to the Vitest config or CI step. Start with a modest goal (e.g., 50-60%) and gradually increase it as coverage improves for critical areas. Don't block development excessively initially.
6.  **Code Reviews:** Include test quality and coverage as part of the code review process.
7.  **Targeted Effort:** Prioritize writing tests for the critical areas identified in Section 4, focusing on stabilizing existing features before aiming for exhaustive coverage everywhere.

## 7. Measuring Success

- **Coverage Reports:** Regularly generate and review coverage reports (`npm run coverage`). Identify critical files/logic with low coverage.
- **Meaningful Coverage:** Focus on _line_ and _function_ coverage, but more importantly, ensure _logic branches_ are tested. High percentage doesn't always mean high quality.
- **Reduced Regressions:** Track if the number of bugs found in previously tested areas decreases over time.
- **Developer Confidence:** Increased confidence when shipping changes due to the safety net provided by tests.

This plan provides a structured approach for a master engineer to systematically improve the Vitest test suite for the Decibel Tribe application.
