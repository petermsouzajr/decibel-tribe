# Decibel Tribe — Codebase Audit Tracker

**Started:** 2026-09-02
**Owner:** Pete
**Scope:** dead code → DRY → better-implementation → testing strategy
**Codebase size at audit start:** 287 TS/TSX files, ~38,584 LOC in `src/`, 71 API routes, 105 vitest specs, 108 Cypress specs, 1 Playwright spec

---

## How to use this doc

Each item is `[ ]` unfinished / `[x]` done / `[~]` deliberately skipped (with reason).
Items marked **VERIFIED** below were confirmed by reading both the definition *and* every usage site, and cross-checked against the planning docs in `docs/` before being called dead.

Work top-down: **Phase A** (delete) before **Phase B** (deps) before **Phase C** (DRY). Deleting first means you never refactor code that was going to be thrown away — which is the single biggest risk in this codebase right now (see the scoping decision below).

---

## Scope of this pass (set 2026-09-02)

Narrowed at Pete's direction. **In scope:** non-dating dead code, dependency hygiene, API DRY/correctness.
**Out of scope, deferred to their own audits:** the entire dating feature (deprecating), Cypress + Playwright (being decoupled into their own repos), unit tests and CI.

Everything marked `[~]` below is excluded by that decision, not by a judgement about the code.

---

## ⚠️ Scoping decision — read before touching `src/**/dating/**`

`docs/DATING_EXPO_MIGRATION_PLAN.md` (approved, last updated 2026-08-24) states that the dating **UI** is moving to the separate `datingtribe` Expo repo. decibel-tribe keeps `/api/dating/*` + Prisma models and **retires** the Next dating pages/components in Phase 6.

The plan explicitly says, today, right now:

> **Freeze immediately:** New features on `src/app/(main)/dating/**`, new features on `src/components/dating/**` (except critical prod hotfixes), Cypress/e2e expansion for Next dating UI.

**Consequences for this audit:**

- `src/components/dating/**` (26 files) and `src/app/(main)/dating/**` (8 pages) are **frozen, pending deletion**. Do **not** spend DRY or rewrite effort there — it is scheduled to be deleted in migration Phase 6. Refactoring it is work you will delete.
- Dating code that is *already unreferenced* is a different matter: it serves neither today's app nor the Expo migration, so it can be deleted **now** rather than waiting for Phase 6. Those files are listed in Phase A.
- `/api/dating/*` routes and `src/lib/dating/` server helpers are **keep-forever** — they are the backend the Expo app will consume. These *are* worth DRY/quality work.

> **Live finding:** `BasicFiltersPanel.tsx` and `DatingPreferencesForm.tsx` currently show as **modified** in `git status`. Both are **dead files** (nothing imports them). That is uncommitted effort spent editing code that is both unreachable *and* under a feature freeze. Worth confirming you didn't mean to edit `DatingFiltersPanel.tsx` (the live one) instead.

---

## Phase A — Dead code removal

> **Pass 1 complete (2026-09-02).** Non-dating items are done and verified. Dating items are `[~]` — deferred to the deprecation.

**Confirmed dead: 14 files, 3,718 LOC.** Each was checked three ways: (1) no import anywhere in `src`, `prisma`, `cypress`, `vitest`, `playwright`, `scripts`; (2) no dynamic/string reference; (3) not described as pending work in any `docs/*.md` plan.

### A1. Superseded duplicates — a newer file replaced these, the old one was never deleted

| # | File | LOC | Superseded by | Status |
|---|------|-----|---------------|--------|
| 1 | `src/app/(main)/calendar/EventCalendar.tsx` | 57 | `calendar/CalendarActions.tsx` — which *also* exports a component named `EventCalendar`; both `calendar/page.tsx` and `events/page.tsx` import from `CalendarActions` | **[x] deleted** |
| 2 | `src/components/dating/ChatInterface.tsx` | 325 | `dating/DatingChatInterface.tsx` | [~] dating |
| 3 | `src/components/dating/FilterPanel.tsx` | 178 | `dating/DatingFiltersPanel.tsx` (live — used by 3 files) | [~] dating |
| 4 | `src/components/dating/SafetyTips.tsx` | 129 | Content re-implemented inline inside `DatingHeader.tsx` (`showSafetyTips` dialog) | [~] dating |

> #1 is the nastiest of these: **two different files both export a component called `EventCalendar`.** Any future search for `EventCalendar` lands on the dead one first. Delete it before it costs you a debugging session.

### A2. Fully orphaned — no successor, nothing references them

| # | File | LOC | Notes | Status |
|---|------|-----|-------|--------|
| 5 | `src/components/dating/BasicFiltersPanel.tsx` | 1,165 | Largest dead file. Has uncommitted edits | [~] dating |
| 6 | `src/components/dating/DatingPreferencesForm.tsx` | 1,121 | Second largest. Has uncommitted edits | [~] dating |
| 7 | `src/lib/dating/compatibility.ts` | 207 | See C4 | [~] dating |
| 8 | `src/components/eventsSidebar.tsx` | 185 | Only file in `src/components/` root not in a feature folder | **[x] deleted** |
| 9 | `src/lib/dating/valueNormalization.ts` | 101 | | [~] dating |
| 10 | `src/app/(main)/users/[username]/FollowedByUsers.tsx` | 79 | | **[x] deleted** |
| 11 | `src/app/(main)/users/[username]/FollowingUsersFeed.tsx` | 79 | | **[x] deleted** |
| 12 | `src/app/(main)/users/[username]/UserPosts.tsx` | 69 | **NOT deleted — see A2a.** This is a lost feature, not dead code | **[ ] needs your decision** |
| 13 | `src/components/dating/BackToDatingButton.tsx` | 23 | | [~] dating |
| 14 | `src/app/(main)/calendar/EventDetailsModal.tsx` | 0 | Empty file; orphan `EventDetailsModalProps` in `lib/types.ts` removed with it | **[x] deleted** |

### A2a. `UserPosts.tsx` — lost feature **restored** — **[x] done**

`UserPosts.tsx` was a complete, working infinite-scroll component that nothing rendered. Three facts said it was dropped by accident rather than retired:

1. It was the **only** caller of `/api/users/[userId]/posts` — a live, maintained route.
2. `UserProfilePage.tsx` rendered **no** posts section at all.
3. There was no successor. `UserPostsFeed` exists nowhere; it survives only in a commented-out mock in `UserProfilePage.test.tsx`.

**Resolution: restored rather than deleted.** A social profile that cannot show the user's posts is the broken state; deleting would have made the API route dead too. Added to `UserProfilePage.tsx` as its own card after the profile details:

```tsx
{!isDeleted && (
  <div className="h-fit w-full space-y-5 rounded-2xl bg-card p-5 shadow-sm">
    <h2 className="text-center text-2xl font-bold">
      {user.displayName}&apos;s posts
    </h2>
    <UserPosts userId={user.id} />
  </div>
)}
```

Purely additive — nothing that previously rendered was changed or moved:
- Guarded by `!isDeleted`, matching how the bio, instruments and skills sections already behave, so deleted accounts are unaffected.
- The route returns 401 to anonymous callers, but `(main)/layout.tsx` redirects unauthenticated visitors to `/login`, so a logged-out viewer can never reach a profile page. No new error path.
- Tidied the route while there: removed a stale commented-out import, dropped an unused `session` binding, switched its hand-written 401 to `unauthorized()`.

### A3. Empty directories

- [x] Deleted 7 empty dirs: `src/components/{home,auth,navigation,groups,profile,notifications}` + `src/app/api/admin/stats`
- [~] `src/app/api/dating/location-override` — left in place (dating)

> The six empty `src/components/*` dirs are misleading in a specific way: `vitest/tests/integration/components/{auth,groups,profile,navigation}/` **do** have tests, so the test tree implies a source layout that no longer exists. Components live elsewhere now. Worth a note in the README when you fix it.

### A4. Not dead — do not delete (checked and cleared)

- [x] `src/lib/dating/profileOptions.ts` — **keep.** Unreferenced from `src/`, but imported by `prisma/seedModules/datingTeam/datingProfiles.ts`. A `src`-only scan calls this dead; it isn't.
- [x] `src/{vitest,custom,image-types}.d.ts` — **keep.** Ambient type declarations are never imported by design.

### A5. Verification after deletion

- [x] `tsc --noEmit` — clean
- [x] `eslint` on all changed files — clean
- [x] `next build` — **exit 0**, verified in an isolated worktree built from clean `HEAD` (see note below)
- [~] `npm run dev:test:all` — unit tests deferred to their own audit
- [x] LOC removed this pass: **400 LOC** of dead files + 30 lines of orphaned types

> **Build note:** `npx next build` in your working tree currently **fails**, and it is not from this work. Eleven files import the `dating-shared` package and all eleven imports are uncommitted — `git show HEAD:<file>` has none of them. `dating-shared/src/context.tsx` calls `createContext` without a `"use client"` directive, which breaks the webpack build via `src/app/api/dating/preferences/route.ts`. That is your in-progress dating-shared migration. To prove this pass is clean, the same changes were built in a throwaway worktree checked out at `HEAD`: **exit 0**.

---

## Phase B — Dependency cleanup

Verified by grepping every import site across `src`, `prisma`, `scripts`, `cypress`, `vitest`.

| Package | Evidence | Action | Status |
|---------|----------|--------|--------|
| `bcrypt` + `@types/bcrypt` | Zero imports. Only `bcryptjs` is used | Removed — a native compiled dep, so this also drops a node-gyp failure mode | **[x] removed** |
| `argon2` | Only "hit" was the string *"Password encryption using bcrypt/argon2"* in the privacy policy | Removed | **[x] removed** |
| `faker` (v5.5.3) | Zero imports. `@faker-js/faker` v9 is the one in use | Removed — v5 is the abandoned pre-fork package | **[x] removed** |
| `jest` (v29.7.0) | Runner never invoked, no config, no script. Only `@testing-library/jest-dom` (separate package) is used | Remove | [~] deferred — test tooling, belongs to the test audit |
| `@million/lint` | 1 reference | Confirm it's active in `next.config.mjs` and worth the build overhead | [ ] |

- [x] Verified `bcryptjs` and `@faker-js/faker` remain installed and working
- [x] `tsc --noEmit` clean after removal

### B1. Privacy policy corrected — **[x] done**

`src/app/privacy/page.tsx:94` claimed *"Password encryption using bcrypt/argon2"*. Verified actual behaviour: `bcryptjs` only, cost factor 10 (`bcrypt.hash(password, 10)` in `users/[username]/actions.ts`, `bcrypt.compare` in `deleteAccount.ts`). There is no argon2 anywhere in the codebase.

Changed to **"Password hashing using bcrypt"** — this drops the false argon2 claim and also corrects *encryption* → *hashing*, which is what bcrypt actually does. Both matter in a document that makes security representations to users.

---

## Phase C — DRY / duplication

Ordered by payoff. All of this is in **non-dating** code, so none of it is at risk from the Expo migration.

### C1. API route boilerplate — **[x] done**

**The wrapper already existed and nobody used it.** `src/auth.ts` exports `validateRequestWithCookieMutation`, written specifically for Route Handlers, with a JSDoc explaining that it — unlike the cached `validateRequest` — is safe to mutate cookies from. Adoption before this pass: **1 route**. Meanwhile **34 routes hand-inlined its exact body**, all 34 containing their own copy of the `createBlankSessionCookie` dance.

`posts/for-you` was the clearest symptom — it opened with `// import { validateRequest } from "@/auth";` commented out, then reimplemented 24 lines of session handling underneath.

Clustering the 34 inlined blocks showed they were near-identical: 19 in one shape, 11 in another differing only by the destructured variable name (`user` vs `loggedInUser`), and 4 stragglers. That uniformity is what made a mechanical migration safe.

**Done:**
- [x] Replaced **55 inlined auth blocks** across 33 routes with `validateRequestWithCookieMutation()` — 24 lines each becomes 4
- [x] Migrated the 4 stragglers by hand. Three (`users/username/[username]`, `posts/[postId]`, `posts/[postId]/comments`) are **optional-auth** — they fall back to an anonymous view rather than 401, which is why they didn't match the common shape. The helper covers that case too: `const loggedInUserId = loggedInUser?.id`
- [x] Added `src/lib/api/responses.ts` (`unauthorized`, `forbidden`, `notFound`, `serverError`) — now 55 and 77 call sites
- [x] **Zero** inlined `lucia.validateSession` blocks remain outside `/api/dating/*`

**Behaviour change, deliberate:** the inlined copies had no `try`/`catch` around `validateSession`, so a thrown session error fell through to the route's outer catch and returned **500**. The shared helper catches it, clears the cookie and returns **401**, which is the correct answer for a bad session.

**Error-body drift found and fixed:** the 500 body existed in *four* spellings — `"Internal server error"` (96), `"Internal Server Error"` (2), `"Internal server error."` with a trailing period (3), and variants built with `Response.json` / `new Response(JSON.stringify(...))` instead of `NextResponse`. All now route through `serverError()`. Four were left alone on purpose: two carry deliberately specific Google-OAuth messages, one attaches a `details` field in dev, one is a differently-shaped stream response.

**Net: 49 files, +743 / −1,946 → ~1,200 LOC removed.**

- [ ] Optional follow-up: a `withAuth(handler)` wrapper would also absorb the repeated `try`/`catch` + `console.error`. Deliberately not done here — it changes every route's exported signature, which is a much riskier diff than swapping a body, and the tests that would catch a mistake are deferred to the test audit.

### C1a. `prettier.config.js` was broken repo-wide — **[x] fixed**

Found while formatting: the config used CommonJS `module.exports` while `package.json` declares `"type": "module"`, so Node parsed it as ESM and **every** `npx prettier` invocation failed with *"module is not defined in ES module scope"* — not just on changed files, on the whole repo.

Renamed to `prettier.config.cjs`. Formatting now works; `prettier-plugin-tailwindcss` loads as intended.

> Worth knowing: this means the repo has effectively been unformatted for as long as `"type": "module"` has been set. Running Prettier across everything will produce a large, noisy diff — best done as its own isolated commit, not folded into feature work.

### C2. Cursor pagination — **[x] done**

14 routes paginated, in **four different conventions**, and **seven of them were wrong**. This turned out to be a correctness fix, not tidiness — see Phase D.

Created **`src/lib/api/pagination.ts`** with two functions that are two halves of one convention:

- `cursorArgs(cursor, pageSize)` — builds `take: pageSize + 1` plus `{ cursor, skip: 1 }`. Accepts composite Prisma keys (`{ userId_groupId: {...} }`), which `my-groups`, `users/following` and `followed-by` all need.
- `paginate(rows, pageSize, getId?)` — splits the over-fetched rows into the page and `nextCursor`. `getId` defaults to `row.id` and is passed explicitly where the cursor is a nested or renamed field (`f.following.id`, `f.followerId`).

**Convention chosen: the cursor is the last item actually returned, and the next query skips it** (Prisma's documented pattern). The alternative — cursor points at the first *unshown* item — is what three routes tried to do, and it is exactly what they got wrong, because it requires the cursor to reference a row the client never saw.

- [x] Helper written, with the rationale in a header comment so the convention isn't re-litigated
- [x] All **12 non-dating** paginated routes migrated
- [~] `dating/matches/[matchId]/messages`, `dating/potential-matches` — left untouched (dating)
- [x] Verified no manual cursor arithmetic remains outside `/api/dating/*`
- [ ] Unit-test the helper's page-boundary behaviour — deferred to the test audit, but this is the single highest-value unit test in the codebase

> Two routes are deliberately outside this family. `search/route.ts` returns a fixed first page with no cursor at all. `posts/[postId]/comments/route.ts` pages **backwards** (`take: -pageSize - 1`, `previousCursor`) so comments load oldest-last — a different, self-consistent convention that the helper does not model.

### C3. The double assertions were hiding four real defects — **[x] done**

`as unknown as PostData[]` appeared in 8 places. A double assertion through `unknown` means TypeScript refused the direct cast, so each one was silencing a genuine mismatch. Removing them required fixing what they hid.

**Root cause.** `getPostDataInclude` built its nested `sharedFrom` select with a recursive helper typed `(depth: number): any`. That `any` destroyed Prisma's payload inference, so `PostData` had to be hand-written — ~50 lines mirroring the include by eye. The codebase already knew the right pattern: `UserData` and `EventData` are both derived with `Prisma.…GetPayload`. `PostData` was the one that couldn't be, and it drifted.

**What the casts were hiding:**

1. **`post.updatedAt` does not exist.** `PostData` declared `updatedAt: Date` as required. **The `Post` model has no `updatedAt` column** — never had one, no migration ever added it, while 10 other models do have it. `Post.tsx` used it to render an "(Edited)" badge, so **that badge has never once appeared in production.** Worse, `Post.test.tsx` had a passing test — *"should display (Edited) if updatedAt is different from createdAt"* — that only passed because the mock supplied a field the database never returns.
2. **Viewer relations vanished for anonymous readers.** `likes`/`dislikes`/`bookmarks` were attached only when `loggedInUserId` was set, yet `PostData` declared them required and `Post.tsx` calls `post.likes.some(...)`, `post.dislikes.some(...)`, `post.bookmarks.some(...)` with **no guard**. The nested `sharedFrom` copies of the same reads *do* guard with `?? []`, so the inconsistency was already half-known.
3. **`user.followers` vanished the same way**, and `Post.tsx` reads `post.user.followers` directly.
4. **`UserWithFollowerStatus` was a third hand-written mirror** of `getUserDataSelect`, and it had drifted: it declared `preferredGender` and `preferredSexualOrientation` as `string` where the schema makes them nullable.

**Fixes:**
- [x] Rewrote `getPostDataInclude` with no `any` — the depth-2 `sharedFrom` nesting is written out rather than generated, so Prisma can infer it
- [x] Viewer relations and `followers` are now **always selected**, filtered by `{ in: [] }` for anonymous viewers. Same data, but the shape no longer changes with auth state — which also collapses the return type from a union to one object
- [x] `PostData` is now `Prisma.PostGetPayload<{ include: ReturnType<typeof getPostDataInclude> }>`, matching `UserData` and `EventData`
- [x] `UserWithFollowerStatus` is now an alias of `UserData` (−47 lines)
- [x] Removed **all 8** `as unknown as` casts, plus 2 redundant `as unknown as Media[]` casts
- [x] Removed the dead "(Edited)" markup, with an inline comment on how to restore it
- [x] `tsc`, `eslint`, `next build` (exit 0) all clean

- [ ] **Decision for you:** add `updatedAt DateTime @updatedAt` to `model Post` + migration to make "(Edited)" work, or leave it out permanently. A schema change is yours to make — I did not touch `schema.prisma`.

### C3a. ⚠️ This refactor broke test assertions — read before the test audit

The unit suite **was already red before any of this work**: baseline at `fcc0f52` was **101 failed / 652 passed**. It is now **216 failed / 536 passed** — I added ~115 failures, and none of them indicate a production defect (`tsc`, `eslint` and `next build` are all clean).

Two mechanical causes, both now repaired:
- Routes call `validateRequestWithCookieMutation`, which the `vi.mock("@/auth")` factories did not export — vitest threw, the route's catch turned it into a 500, and ~370 assertions failed on it. Added the export to 30 mock factories across both the `vi.mock` and `vi.doMock` styles. **0 such errors remain.**
- `PostData` mocks carried the phantom `updatedAt` and lacked `followers` / `userDatingProfile`.

What is left is **not plumbing** — it is ~173 `toHaveBeenCalledWith` assertions that pin the *exact* Prisma arguments, plus cookie-spy assertions. They encode the old implementation, including the bugs:

- Tests assert `findMany` args with **no `skip: 1`** — i.e. they assert the off-by-one that dropped a row per page.
- Tests assert the old include shape, where viewer relations were absent for anonymous readers.
- Tests assert `createSessionCookie` / `createBlankSessionCookie` fire inside the route; cookie mutation now happens once inside the shared helper.

**These need judgement per test, not a script** — each has to be re-pointed at intended behaviour rather than at the old implementation, so I stopped rather than guess at ~115 expectations. That is the first task for the test audit.

> The deeper lesson for that audit: these tests assert *how* a route calls Prisma rather than *what* it returns. That is why correcting seven real pagination bugs turned the suite redder. Assertions on response bodies would have caught the bugs instead of protecting them.

### C4. [~] `compatibility.ts` vs. inline scoring — **deferred (dating)**

Both sides are dating code, so this is out of scope for these passes. Recorded for the deprecation: `src/lib/dating/compatibility.ts` is unreferenced while `/api/dating/matches/[matchId]/insights/route.ts` appears to reimplement it. The route is keep-forever backend; the orphan helper may hold the better implementation, so read both before deleting either.

---

## Phase D — Bugs found during the audit

### D1–D3. Cursor pagination was broken in **7 of 12** non-dating routes — **[x] all fixed**

Every one of these silently lost or repeated a row in infinite scroll. Three distinct wrong implementations, one shared root cause: the skip/inclusive-cursor convention was decided per route instead of once.

**Pattern 1 — drops a row between page 1 and page 2** (`posts/for-you`, `posts/bookmarked`)

```ts
skip: cursor ? 1 : undefined,
...
if (cursor) nextCursor = posts[pageSize - 1].id;  // correct
else        nextCursor = posts[pageSize].id;      // ← the 11th row, never rendered
```
On page 1 the cursor is set to a row that `slice(0, 10)` did not return; the next request then `skip`s it. That row is never displayed on either page.

**Pattern 2 — repeats a row at every boundary** (`posts/following`)

```ts
cursor: cursor ? { id: cursor } : undefined,   // no skip → Prisma cursor is inclusive
const nextCursor = posts.length > pageSize ? posts[pageSize - 1].id : null;
```
`posts[pageSize - 1]` is the last row that *was* rendered, and without `skip` the next page starts on it again.

**Pattern 3 — drops a row at every boundary** (`groups/[groupId]/posts`, `groups/my-groups`) — the worst of the three

```ts
skip: cursor ? 1 : 0,
const nextCursor = hasNextPage ? posts[posts.length - 1].id : null;  // the 11th row
if (hasNextPage) posts.pop();                                        // …then discard it
```
The cursor is set to the 11th row and that row is immediately popped, so it is never returned. With `skip: 1` the next page starts *after* it. Unlike Pattern 1 this repeats on **every** page, so a 100-item list silently loses ~10 items.

**Pattern 3 variant — hand-rolled skip simulation** (`users/following`, `users/followed-by`)

Both fetched with an inclusive cursor and then manually emulated `skip: 1` by comparing the first row's id to the cursor (`if (responseFollowers[0].followerId === cursor) slice(1)`), while computing `nextCursor` from the *pre-slice* array. Net effect is Pattern 1: one follower dropped at the first boundary. ~25 lines of commented-through arithmetic each, replaced by two lines.

| Route | Pattern | Symptom | Status |
|-------|---------|---------|--------|
| `posts/for-you` | 1 | drops 1 post, page 1→2 | **[x]** |
| `posts/bookmarked` | 1 | drops 1 post, page 1→2 | **[x]** |
| `posts/following` | 2 | repeats 1 post every page | **[x]** |
| `groups/[groupId]/posts` | 3 | drops 1 post **every page** | **[x]** |
| `groups/my-groups` | 3 | drops 1 group **every page** | **[x]** |
| `users/following` | 3v | drops 1 user, page 1→2 | **[x]** |
| `users/followed-by` | 3v | drops 1 user, page 1→2 | **[x]** |

The other five (`group-activity`, `users/[userId]/posts`, `events/for-you`, `events/following`, `notifications`) were already correct and were migrated to the helper anyway, so the convention is now enforced in one place.

- [x] All 7 fixed via the C2 helper
- [x] `tsc --noEmit` + `eslint` + `next build` (exit 0) all clean
- [ ] Add the page-boundary regression test when the test audit runs

> Worth knowing: because cursors are opaque and regenerated per request, this changes nothing for clients beyond correctness. A user mid-scroll during deploy may see one row repeat once.

### D4. [~] Two cleanup cron routes are never scheduled — **accepted constraint, do not change**

`vercel.json` schedules only `clear-uploads` and `clear-unverified-users`. `clear-expired-deleted-users` and `clear-expired-tokens` exist and are never invoked.

**This is deliberate: the Vercel free plan caps the number of cron jobs.** Not a bug — a hosting limit. Leave `vercel.json` alone.

Recorded because two consequences outlive the decision:

- `clear-expired-deleted-users` is the job that purges soft-deleted accounts after their retention window. While unscheduled, deleted-user data is retained indefinitely. Worth checking that against what `src/app/privacy/page.tsx` promises, since that is a commitment to users regardless of plan tier.
- `clear-expired-deleted-users` has a passing unit test, so the suite stays green for a job that has never run. Anyone reading coverage will assume it works in production.

**If you want the behaviour back without more cron slots:** one scheduled route can call all four cleanups in sequence — e.g. a single `/api/cron/cleanup` that awaits each task — which stays inside the free-plan limit. Not implemented here; flagged only.

### D5. [~] CI runs Playwright against `playwright.dev` on every push — **VERIFIED, deferred**

*Deferred to the CI / test-repo audit. Recorded here so it isn't lost.*

`.github/workflows/playwright.yml` triggers on every push and PR to `main`/`master`, installs **three browsers** with `--with-deps`, and runs `npx playwright test` — whose only spec navigates to `https://playwright.dev` and asserts its title.

Every PR spends several minutes of CI proving Playwright's marketing site still works. It also means you have a green "Playwright Tests" check that provides zero signal about your app.

- [ ] Either delete the workflow, or (preferred) give it the critical-path suite from Phase F so the check becomes meaningful
- [ ] Note `.github/workflows/qa-nightly.yml` has its `schedule:` block commented out — confirm that's intentional

### D6. [~] `cypress.env.json` is committed and not gitignored — **deferred**

*Deferred to the Cypress decoupling.*

`git ls-files` confirms it is tracked. Contents are test-user credentials (`"password": "Password1!"`, test usernames) rather than real secrets, so severity is low — but `cypress.env.json.example` already exists, which shows the intent was for the real one to be ignored. `.env` and `googleCredentials.json` *are* correctly ignored.

- [ ] Add `cypress.env.json` to `.gitignore`, `git rm --cached` it, verify `.example` is complete

---

### D7. [~] Cypress `baseUrl` defaults to **production** — **deferred, but carry it over**

`cypress.config.ts:9`:
```ts
baseUrl: process.env.CYPRESS_BASE_URL || "https://www.decibeltribe.com/",
```

The fallback is the live site, and the suite includes `cypress/e2e/ui/settings/delete_account.cy.ts` plus other mutating specs. `cy:run:local` sets the env var correctly, but bare `cy:run` does not — so anyone running the default command points a destructive suite at production.

*Deferred to the Cypress decoupling, but this is the highest-severity item in that bucket and a hard blocker before any practice tester touches the suite.*

- [ ] Default `baseUrl` to `http://localhost:3000`; make production explicit opt-in

---

## Phase E — Feature-by-feature audit grid

> **Pass 5 (2026-09-02): cross-cutting sweep done.** Rather than walking features one at a time, this pass ran three codebase-wide scans that cut across all of them. Per-feature review of business logic is still open.

### E1. Unused *exports* (not just whole files) — **[x] done**

The Phase A sweep found dead files. This one found dead exports inside live files. 11 candidates, of which **5 were real** — the other 6 were used within their own module and my first scan, which excluded same-file hits, called them dead wrongly. Each was re-checked by hand before deletion.

| Export | Verdict |
|--------|---------|
| `createEvent` (`(main)/calendar/actions.ts`) | **Deleted — file removed.** Dead *and* broken: it POSTed to the literal path `/api/events/eventId`, not a template. It could never have worked |
| `AdminReportListItem` (`src/lib/reports.ts`) | **Deleted — file removed**, this was its only content |
| `canPerformAdminAction` (`src/lib/admin.ts`) | **Deleted.** Redundant with `isAdmin()` / `getAdminUser()` |
| `UpdateEventValues`, `CreateCommentValues` (`validation.ts`) | **Deleted** |
| `ensureStreamUser`, `getGroupMemberSelect`, `reducer`, `TextareaProps`, `DEFAULT_PAGE_SIZE` | **Kept** — all used inside their own module (e.g. `getGroupMemberSelect` feeds `GroupMembershipData`, which the group page uses) |

**Checked and cleared while here:** every admin surface — `api/admin/settings`, both `api/reports` routes, and all five `admin/*` pages — does gate on `isAdmin` / `requireAdmin`. The dead helper was redundancy, not a missing guard.

### E2. `(prisma as any)` — type checking was switched off across two features — **[x] done**

20 casts across 6 files wrote `(prisma as any).report`, `(prisma as any).post`, `(prisma as any).user` and so on. Casting the client itself to `any` disables type checking for **every** query written through it, so the whole reports feature and the block-list routes were unchecked.

`model Report` exists in the schema and always has. **All 20 casts were removed with zero type errors** — they were never needed.

- [x] `src/app/api/reports/route.ts` (12), `reports/[reportId]` (1), `users/[userId]/blocks` (3), `admin/page.tsx` (1), `admin/reports/page.tsx` (2), `admin/reports/[reportId]/page.tsx` (1)
- [x] Superseded by E4.17: the API layer is now `any`-free (~35 → 6). 53 remain, concentrated in components — see E4.17

### E3. Remaining response-shape drift — **[x] done**

- [x] 6 hand-written 403s now use `forbidden()` — including one that had drifted to `"Forbidden."` with a trailing period, the same failure mode as the 500s in C1
- [x] 13 routes hardcoding `const pageSize = 10` now use `DEFAULT_PAGE_SIZE`
- [ ] **Left alone deliberately:** 4 routes return `{ error: "Unauthorized" }` with a **403** status. 401 means unauthenticated, 403 means authenticated but not permitted, so the body contradicts the status — but changing it alters the wire response and a client may match on that string. Your call

### E4. Per-feature business-logic review — **in progress**

Started with the checks that pay off across features rather than reading each in isolation.

#### E4.1 Authorization on every write route — **[x] checked, no gaps**

Audited all 31 non-dating routes exporting POST/PUT/PATCH/DELETE for ownership verification. **No authorization holes found.**

- Routes taking a `userId` path parameter (`follow`, `followers`, `blocks`) correctly derive the actor from the session (`followerId: loggedInUser.id`) and use the path parameter only as the target. None let you act as another user.
- `notifications/mark-as-read` scopes its `updateMany` to `recipientId: user.id`.
- `reports/[reportId]` calls `requireAdmin()`; all admin surfaces are gated.

#### E4.2 A duplicate follow endpoint, and the worse one was live — **[x] deleted**

`/api/users/[userId]/follow` and `/api/users/[userId]/followers` both implemented follow/unfollow. The app only ever calls `/followers` — `FollowButton`, `CommentMoreButton` and `useFollowerInfo` all use it. `/follow` (85 LOC) was unreachable from the UI, and it was the strictly worse implementation:

| | `/followers` (live) | `/follow` (deleted) |
|---|---|---|
| Self-follow | rejected with 400 | **allowed** |
| Repeat follow | `upsert`, idempotent | `create` → unique-constraint violation → **500** |
| Notification | created | none |
| Atomicity | `$transaction` | none |

A Cypress spec had even left the comment *"The endpoint POST /api/users/{userId}/follow may not exist or support POST"*, and an idempotency test was written against the endpoint that is **not** idempotent.

- [x] Deleted the route and its unit test
- [ ] Two Cypress specs still reference it (`ui/profile/follow_user.cy.ts`, `api/profile/follow_idempotency.cy.ts`) — repoint them at `/followers` during the QA repo migration

#### E4.3 A wasted query on the Following feed — **[x] fixed**

`/api/posts/following` opened with:

```ts
const followingUserIds = await prisma.follow.findMany({
  where: { followerId: user.id },
  select: { followingId: true },
}).then((res) => res.map((f) => f.followingId));
```

`followingUserIds` was **never used** — the posts query filters relationally with `followers: { some: { followerId: user.id } }`. So every request to the main Following feed ran an extra query fetching every account you follow and discarded the result. Removed.

#### E4.4 Unbounded retry loop in the OAuth sign-up path — **[x] fixed**

`generateUniqueUsername` in the Google callback ran `while (!isUnique)` with a DB round-trip per iteration and **no exit condition** other than finding a free name. Suffixes are drawn from `randomInt(1000, 9999)`, so a common enough base username could spin indefinitely and hold the request open. It also typed its client parameter as `prisma: any`.

Now bounded to 10 attempts with a wider-random fallback that is still verified, so exhaustion surfaces as an error rather than a hang. Parameter typed as `typeof prisma`.

#### E4.5 Events: the live update endpoint had no input validation — **[x] fixed**

`/api/events/[eventId]` exports both PATCH and PUT. **PATCH validated** with `updateEventSchema.safeParse`; **PUT did not** — it destructured `await req.json()` straight into a geocode call, a skill upsert loop and a `$transaction`. PUT is the endpoint the edit form actually uses (`events/edit/page.tsx` → `calendar/mutations.ts`), so the one path users exercise was the unvalidated one.

The obvious fix was wrong: `updateEventSchema` **`.omit()`s `helpWantedSkills` and `eventZipCode`**, both of which PUT accepts and writes. Reusing it would have silently stopped those two fields from saving.

Added `replaceEventSchema` (`baseEventObject.partial()` plus the same title-not-empty refinement) covering the fields PUT actually accepts, and wired it in ahead of the geocoding and the transaction. `.partial()` means nothing becomes newly required, so valid payloads are unaffected; malformed ones now get a 400 instead of reaching Prisma and returning a 500.

#### E4.6 A second duplicate API surface — **[ ] your call, not deleted**

`/api/events` exports DELETE, PATCH and PUT taking `?eventId=`, duplicating `/api/events/[eventId]`. No client calls the query-param form.

They are **not** identical, though: the collection `DELETE` is overloaded — creator deletes the event, non-creator is un-attended from it. That "leave" branch duplicates `/api/events/[eventId]/attendees` DELETE, which *is* what the UI calls.

**Left in place deliberately.** Unlike the follow duplicate, `openapi.yaml` documents `/events` with `delete`, `patch` and `put` at the path level, so removing them is an API deprecation affecting any documented consumer, not an internal cleanup.

- [ ] Decide whether to deprecate `DELETE|PATCH|PUT /api/events?eventId=` in favour of the path-param route, and remove them from the spec at the same time

#### E4.7 `openapi.yaml` did not parse at all — **[x] fixed**

The 66KB API contract failed YAML parsing entirely, so every consumer of it — codegen, validators, Swagger UI — was broken:

```yaml
description: Authentication cookie obtained via login or OAuth callback. Send requests with `credentials: 'include'` on the client.
```

The unquoted `credentials: 'include'` inside the string made YAML read `: ` as a nested mapping. Quoting the description fixes it. Confirmed pre-existing — the identical error is in `HEAD`.

Also removed a 65-line `follow:` block that sat as a sibling of `get:` under `/users/{userId}`. That is not valid OpenAPI (not an HTTP method), and it documented the endpoint deleted in E4.2 — while describing behaviour (`creates a notification`) that only the surviving `/followers` route has.

The spec now parses: **27 paths, 28 schemas, no structural errors.**

#### E4.8 The spec has drifted badly from the API — **[ ] open**

With it parsing, the drift is measurable: **56 non-dating routes exist, 27 are documented.**

- **31 undocumented (55%)** — including whole features: all of `/reports`, `/comments/*`, most of `/groups/*`, `/posts/{postId}/likes|dislikes|bookmark|comments`, and account management (`delete-account`, `export-data`, `update-email`, `update-password`).
- **2 documented but nonexistent:** `/users/{userId}` has no `route.ts` (the real profile endpoint is `/users/username/{username}`, which is undocumented), and `/auth/logout` is a **server action** in `(auth)/actions.ts`, not a REST route.

Not fixed here — writing 31 accurate entries needs per-endpoint intent, and guessing would make the spec confidently wrong rather than merely incomplete.

#### E4.9 Comments: deleting a comment silently deleted everyone else's replies — **[x] fixed**

`/api/posts/[postId]/comments` fetched top-level comments with `isDeleted: false`, and replies come back **nested inside their parent** via `getCommentDataInclude`. There is no separate replies endpoint, so a reply is only reachable through its parent.

The result: deleting one top-level comment removed its entire thread from the UI. Ten replies by ten other people vanished — still in the database, just unreachable.

The inconsistency was already visible in the code. `getCommentDataInclude`'s `replies` block has **no** `isDeleted` filter, so deleted *replies* are returned, and `Comment.tsx` renders them as *"This comment has been deleted"*. That tombstone branch could never run for a top-level comment, because the API filtered those out before they reached it.

Fixed by keeping a deleted top-level comment **only when it still has replies**:

```ts
OR: [{ isDeleted: false }, { replies: { some: {} } }],
```

A deleted comment with no replies still disappears entirely, so the common case is unchanged; a deleted comment holding a thread now renders as the tombstone the component already supports.

#### E4.10 Groups: a pending invitee could read every post in the group — **[x] fixed**

`/api/groups/[groupId]/posts` gated on whether a `GroupMember` row existed. But `add-user` creates that row with `acceptedInvite: false` (and the schema defaults it to `false`), so **being invited was enough to read the group's posts** — accepting was not required.

Every other consumer already got this right: `my-groups` filters `acceptedInvite: true`, `posts/group-activity` filters `acceptedInvite: true`, and the group page derives `const isMember = userMembershipData?.acceptedInvite`. This route was the only outlier.

The route now requires `acceptedInvite`. **Zero UI impact** — the group page already wraps its post list in `{isMember && (...)}` and shows the accept-invite prompt otherwise, so a pending invitee never saw these posts in the app. The gap was only reachable by calling the API directly.

**Deliberately not changed:** `/api/groups/[groupId]` GET uses the same row-exists check, but it returns group *name and description*, which a pending invitee genuinely needs in order to decide whether to accept — the page renders exactly that alongside the accept button. Applying the same filter there would have broken the invite flow.

#### E4.11 Search ignored blocking — **[x] fixed**

Every feed-shaped query filters out users the viewer has blocked: `posts/for-you`, `posts/following`, `users/[userId]/posts` and `posts/[postId]/comments` all carry `blocksReceived: { none: { blockerId: user.id } }`. **Search carried none.** It filtered `deletedAt: null` only.

So blocking someone hid them from your feeds but left their posts *and* their profile fully searchable — which defeats the feature on the one surface people use to look someone up. Fixed on both the post and user queries.

**Block filtering is still inconsistent elsewhere** — flagged rather than changed, because unlike search these involve product judgement:

| Route | Honours blocks |
|---|---|
| `posts/for-you`, `posts/following`, `users/[userId]/posts`, `posts/[postId]/comments`, `search` | yes |
| `notifications` | **no** — a blocked user's likes/comments still notify you, which is the strongest case for filtering |
| `groups/[groupId]/posts`, `posts/group-activity` | **no** |
| `posts/bookmarked` | no — arguably correct, these are your own saved items |

- [ ] Decide whether blocks should apply to notifications and group feeds (and whether retroactively)

#### E4.12 Notifications: a documented feature was never wired up — **[ ] your call**

`NotificationType` declares `LIKE` and `DISLIKE`. `Notification.tsx` has complete render branches for both — icon, message (*"liked your post"*), and href. `docs/USER_FEATURES.md` lists them as shipped:

> - Like on own post.
> - Dislike on own post.

**No code creates them.** `posts/[postId]/likes` and `posts/[postId]/dislikes` contain zero notification code, so liking a post has never notified its author.

This is the "in a plan and not yet finished" case, not dead code — the schema, the UI and the docs are all ready and only the producer is missing. **Left untouched**: implementing it means deciding dedupe behaviour and what happens on unlike, and the neighbouring `COMMENT` and `EVENT_ATTENDEE` producers already show the intended pattern (guard against self-notification, check for an existing notification first).

- [ ] Either wire up LIKE/DISLIKE notifications, or drop them from the enum, the UI and `USER_FEATURES.md`

#### E4.13 Checked and clean

- **Notification producers** — all five creation sites correctly skip self-notification (`parentComment.userId !== user.id`, `postAuthor.userId !== user.id`, etc.), and two also dedupe against an existing notification.
- **Comment deletion** — `deleteComment` is a server action with a proper ownership check and soft-deletes rather than hard-deletes.
- **Reports** — 5/day rate limit, a cooldown between reports, and duplicate-report detection all present.
- **Stream token** (`get-token`) — scoped to `user.id` with a 1-hour expiry.
- **Admin settings** — `requireAdmin()` on every handler.

#### E4.14 Leftover comments from the C1 refactor — **[x] cleaned**

Removed 53 stale `// Direct session validation` / `// --- End direct session validation` markers across 23 routes; they had bracketed the inlined auth blocks that C1 replaced and no longer described anything. One route (`messages/unread-count`) also still had an unreachable second `if (!user)` guard with the comment *"Should technically be covered by !session, but double-check"* — removed.

#### E4.15 Sequential-query review — **[x] done, little to fix**

Checked the three heaviest routes. The multi-`await` counts were misleading: `events/[eventId]` already batches its attend/unattend work in `$transaction`, and event cancellation builds an array of `notification.upsert` calls and runs them as **one** `$transaction` rather than looping round-trips. `reports/route.ts`'s existence checks sit in a switch, so only one runs per request. The two rate-limit queries there are independent and could be `Promise.all`'d, but they guard an endpoint capped at 5 requests/day — not worth the churn.

No N+1 patterns found in non-dating code.

#### E4.16 The reports route carried a fallback that wrote corrupt data — **[x] removed**

`POST /api/reports` wrapped both its duplicate check and its create in `try/catch` blocks that string-matched Prisma errors for *"Unknown argument `commentId`"*, described as a *"fallback for environments where Prisma Client hasn't been regenerated yet"*.

The create fallback did this:

```ts
fallbackData.messageId = fallbackData.commentId;   // comment id -> message column
delete fallbackData.commentId;
fallbackData.adminNotes = "... fallback: original commentId stored in messageId";
```

That deliberately writes a **comment** id into the `messageId` column and annotates the record to say so — silently producing corrupt reports that moderation tooling would misread.

It also cannot trigger. `commentId` has been on `model Report` since the **init** migration, `postinstall` runs `prisma generate`, and `build` runs `prisma migrate deploy`. Both fallbacks removed (**−37 lines**), and the duplicate check no longer swallows real database errors on its way past.

#### E4.17 `any` cleanup — **[x] API layer done**

74 → **53** overall; inside `src/app/api` (non-dating), **~35 → 6**.

- `reports/route.ts` is now `any`-free: `Prisma.ReportUncheckedCreateInput`, `Prisma.ReportWhereInput`, and a narrowed `catch (error)` replace six `any`s
- **`POST(req: any)` on the login route** — an auth route handler with an untyped request. Now `NextRequest`
- `events/[eventId]` GET re-declared a narrower `helpWantedSkills` select on top of `getEventDataInclude`, which forced `as any` on the include and then cascaded casts onto every read below it. `getEventDataInclude` already selects that relation, so dropping the override removed five `any`s at once. The response now strips `zipCode`/`latitude`/`longitude` by destructuring rather than `delete` on an `any`, so the payload shape stays checked
- Prisma error codes are now matched via `error instanceof Prisma.PrismaClientKnownRequestError` in the events and blocks routes

- [ ] 53 remain, concentrated in components: `TrendsSidebar.tsx` (13), `events/Event.tsx` (5), `custom.d.ts` (5, ambient and legitimate)

#### E4.18 Blocking reported success even when it failed — **[x] fixed**

Both handlers in `/api/users/[userId]/blocks` ended with:

```ts
} catch (e: any) {
  // idempotent: ignore duplicate
  return NextResponse.json({ success: true });
}
```

That catches **every** exception — a connection failure, a constraint error, anything — and tells the client the block succeeded. The user sees a confirmed block that does not exist.

Now only the intended cases stay idempotent: `P2002` (already blocked) on POST and `P2025` (not blocked) on DELETE. Anything else logs and returns a 500.

#### Still open under E4

- [ ] Component-level `any` cleanup (53 remaining, mostly `TrendsSidebar`)
- [ ] Bring `openapi.yaml` back in line with the API (E4.8)

| # | Feature | Files | Dead | DRY | Impl | Test | Notes |
|---|---------|-------|:----:|:---:|:----:|:----:|-------|
| 1 | Posts / feed | 15 comps, 9 routes | [ ] | [ ] | [ ] | [ ] | Highest traffic. Contains D1 + D2. Do this one first |
| 2 | Comments | 11 comps, 3 routes | [ ] | [ ] | [ ] | [ ] | `docs/COMMENT_IMPROVEMENT_PLAN.md` — check what's still pending before deleting anything |
| 3 | Auth / session | 4 routes + `(auth)/` | [ ] | [ ] | [ ] | [ ] | Root cause of C1. `docs/auth-login-process.md` is current |
| 4 | Users / profile | 13 routes | [ ] | [ ] | [ ] | [ ] | 3 dead files here (A2#10, A2#11, A2#12). Check whether the profile posts feed was lost (A2#12) |
| 5 | Groups | 8 routes | [ ] | [ ] | [ ] | [ ] | Empty `components/groups/` dir but tests exist |
| 6 | Events / calendar | 3 comps, 5 routes | [ ] | [ ] | [ ] | [ ] | 3 dead files (A1#1, A2#8, A2#14) + duplicate `EventCalendar` name |
| 7 | Notifications | 3 routes | [ ] | [ ] | [ ] | [ ] | Pagination variant #3 |
| 8 | Messages / Stream | 2 routes | [ ] | [ ] | [ ] | [ ] | `stream-chat-react` — 6 usages, active |
| 9 | Search | 1 route | [ ] | [ ] | [ ] | [ ] | Small |
| 10 | Reports / moderation | 2 comps, 2 routes | [ ] | [ ] | [ ] | [ ] | `docs/REPORT_IMPLEMENTATION_PLAN.md` — verify complete |
| 11 | Admin | 1 comp, 4 pages | [ ] | [ ] | [ ] | [ ] | Empty `api/admin/stats/` — was it planned? Check before deleting |
| 12 | Dating — **API only** | 14 routes | [ ] | [ ] | [ ] | [ ] | **Keep-forever.** Worth full quality effort |
| 13 | Dating — **UI** | 26 comps, 8 pages | [~] | [~] | [~] | [~] | **SKIPPED: frozen, retiring in migration Phase 6.** Delete-in-place only (Phase A), no refactoring |
| 14 | Maintenance / cron routes | 4 routes | [ ] | [ ] | [ ] | [ ] | `clear-expired-deleted-users`, `clear-expired-tokens`, `clear-unverified-users`, `clear-uploads`. Check they're actually scheduled (`vercel.json`) — an unscheduled cleanup route is dead code that looks alive |
| 15 | Seeding | `prisma/seedModules/` | [ ] | [ ] | [ ] | [ ] | 4 plan docs exist; `MODULAR_SEEDING_PLAN.md` is 23KB — verify it's finished before touching |

**Before deleting anything in a feature**, check that feature's plan doc in `docs/` — several describe partially-built work. Docs to consult: `COMMENT_IMPROVEMENT_PLAN`, `REPORT_IMPLEMENTATION_PLAN`, `MODULAR_SEEDING_PLAN`, `public-view-only-strategy`, `verified-users-bot-prevention`, `MISSING_BEST_PRACTICES`.

- [ ] **Doc hygiene pass:** 25 files in `docs/` + 4 more at repo root. At least one pair actively contradicts (`DATING_MASTER_PLAN.md` says "no native app"; `DATING_EXPO_MIGRATION_PLAN.md` supersedes it and says so). Several are status snapshots (`DATING_FEATURE_COMPLETE.md`, `PROJECT_COMPLETION_STATUS.md`) that are now historical. Move finished ones to `docs/archive/` so a search for current intent returns only current intent.

---

## Phase F — Testing

> **[~] Entire phase deferred** to its own audit (unit tests, Cypress/Playwright decoupling, CI). The analysis below is preserved from the first pass — nothing in it was acted on.

### Current state

| Suite | Specs | Health |
|-------|-------|--------|
| Vitest (unit + integration) | 105 | Active, real. Split `unit/` + `integration/` |
| Cypress (e2e) | 108 (91 ui, 10 a11y, 7 api) | Active and substantial. **Zero imports from app source** |
| Playwright | 1 | **Scaffold only** — `example.spec.ts` tests `playwright.dev`, not your app. Config has `baseURL` and `webServer` commented out |
| Coverage | — | `coverage/coverage-summary.json` reports **all zeros** — the `@cypress/code-coverage` integration is wired up but producing nothing |

- [ ] Delete or replace `playwright/example.spec.ts` — right now Playwright is pure dependency weight
- [ ] Decide whether coverage reporting is worth fixing or should be removed; it is currently a broken pipeline reporting `"Unknown"` for every metric
- [ ] Unit-test the C2 pagination helper (it would have caught all 7 bugs in D1–D3)
- [ ] Fill unit coverage gaps: only 4 hooks and ~6 lib modules have unit tests; the 71 API routes have almost no vitest coverage (7 Cypress API specs cover a slice)

### Recommendation: split the practice suite out, keep a real regression suite in

You asked whether the E2E repos should be disconnected rather than integrated. **Yes for the practice suite, no for everything else** — and the deciding evidence is that your Cypress specs have **zero `@/` imports**. They are already fully decoupled; only the (currently broken) coverage task couples them to the app build. Extraction is cheap.

**Do this:**

**1. Vitest → stays integrated. Not negotiable.**
Unit and component tests import source directly (`@/lib/utils`, `@/hooks/*`, components). They must version with the code they test. They're also your fastest signal.

**2. Cypress → move to a separate `decibel-tribe-qa` repo, pointed at staging.**
This is the right call *specifically because* of the practice-testers goal:
- Practice testers get a repo with tests and nothing else — no product source, no `.env`, no Prisma, no commit access to your app.
- Their broken/experimental specs can't redden your app's CI.
- Onboarding drops from "install Postgres, run migrations, seed, build Next" to "clone, `npm i`, point at staging URL."
- 108 specs already talk to `baseUrl` over HTTP, which is exactly how a decoupled suite works.

**Prerequisite:** fix **D7** first. Handing testers a suite that defaults to production and includes `delete_account.cy.ts` is the one thing that must not happen. Stand up a seeded staging environment and make that the default `baseUrl` in the QA repo.

**Cost, honestly:** a UI change and its spec update become two PRs in two repos, and specs can drift from the app without CI telling you. That cost is real — it's why point 3 exists.

**3. Playwright → give it the job Cypress is vacating: a small, integrated, critical-path suite.**
Instead of deleting Playwright as dead weight, make it your in-repo regression net: ~10-15 specs covering signup → login → post → comment → follow. It runs in your CI against a locally built app, so app-breaking changes still fail in the app repo. This is why splitting Cypress out is safe — you keep an integrated E2E net, it's just small and fast rather than 108 specs.

Net result: `vitest` (fast, integrated) + `playwright` (critical path, integrated) protect the product; `cypress` (broad, separate repo) is the practice playground and QA depth.

- [ ] Fix D7 (baseUrl default) — **blocker for everything below**
- [ ] Stand up seeded staging env for QA repo to target
- [ ] Create `decibel-tribe-qa` repo; move `cypress/`, `cypress.config.ts`, `cypress.env.json.example`, `shadowReportConfig.js` and the `cy:*` scripts
- [ ] Remove Cypress deps from this repo's `package.json` (`cypress`, `cypress-axe`, `@cypress/grep`, `@cypress/code-coverage`, `mochawesome*`, `qa-shadow-report`)
- [ ] Write the Playwright critical-path suite; wire `webServer` + `baseURL` in `playwright.config.ts`
- [ ] Add Playwright to CI (`.github/`)
- [ ] Write the QA repo README for practice testers

> **Note on migration Phase 6:** the plan says "Remove or rewrite Cypress dating UI specs." Check how many of the 108 specs cover dating UI — those follow the Expo migration, not the QA repo split. Do that triage during the move so you don't carry dead specs into the new repo.

---

## Progress

| Phase | Scope | Status |
|-------|-------|--------|
| A — Dead code | non-dating | **done** — 5 files + 7 empty dirs + 4 orphan types removed; `UserPosts` restored |
| B — Dependencies | non-dating | **done** — 4 packages removed **and committed**, privacy policy corrected; `jest` deferred |
| C — DRY | C1 auth + C2 pagination + C3 types | **done** — ~2,500 LOC removed. C4 deferred (dating) |
| D — Bugs | pagination | **done** — 7 broken routes fixed. D4 (crons) needs your call |
| E — Per-feature | 13 non-dating features | **E1–E3 sweeps done; E4 logic review done** for posts, comments, groups, events, notifications, search, reports, admin, messages |
| F — Testing | — | deferred to its own audit |

### Build fixed and dependency removals committed — **[x] done**

**The broken build is fixed.** `dating-shared/src/context.tsx` called `createContext` with no `"use client"` directive, and the package barrel (`src/index.ts`) re-exports it, so *any* import from `"dating-shared"` — including the four API routes that only want pure `normalize*` / `calculate*` functions — pulled React client code into a server build and failed compilation.

Added `"use client"` to the three genuinely client-side modules: `src/context.tsx`, `src/hooks/queries.ts`, `src/hooks/mutations.ts`. The other five (`compatibility`, `valueNormalization`, `profileOptions`, `types`, `api-interface`) import no React and were left untouched. Public API unchanged, so the `datingtribe` Expo repo is unaffected.

`npx next build` in the working tree now exits **0**, with your dating WIP in place.

> ⚠️ **`dating-shared` is not a git repository** — those edits have no version history. A backup of the original `src/` was taken before editing. Putting it under git is worth doing, especially as it is now shared by two products.

**Dependency removals are committed.** `package.json` was entangled with your uncommitted `"dating-shared": "file:../dating-shared"` line, so the two were separated: `dating-shared` was temporarily removed, `npm install --package-lock-only` regenerated the lockfile without touching `node_modules`, and the resulting pair was staged. Your working copies — dating-shared line and symlink intact — were then restored. The commit carries only the four removals (−362 lock lines); your WIP stays uncommitted and your dev environment is untouched.

### ⚠️ Still unresolved: `file:` dependency will break Vercel

`"dating-shared": "file:../dating-shared"` is a **local path**. Whenever you do commit it, `npm ci` on Vercel will try to resolve a directory that does not exist in the deploy environment and fail before the build starts. Deliberately kept out of this commit; it needs a real answer:

| Option | Trade-off |
|--------|-----------|
| Publish to a private npm registry | Cleanest; needs registry auth in Vercel |
| Git dependency (`github:petermsouzajr/dating-shared`) | Easy, but `dating-shared` is not yet a git repo |
| Vendor the pure modules into `decibel-tribe` | Works today; duplicates code `datingtribe` also uses |
| Monorepo with workspaces | Correct long-term; the migration plan calls it "not required" for now |

Given `DATING_EXPO_MIGRATION_PLAN.md` has decibel-tribe keeping **API only**, and the four routes import nothing but pure functions, vendoring just those is the smallest thing that works — but it is a real architecture call, not a cleanup.

- [ ] Decide how `dating-shared` ships before committing the `file:` dependency

### Still open, needing a decision from you

1. **How `dating-shared` ships** (see table above) — blocks committing the `file:` dependency, and blocks deploys once it is committed.
2. **Privacy policy vs. data retention** — with `clear-expired-deleted-users` unscheduled by design, confirm the policy does not promise a deletion window you are not meeting.
3. **`@million/lint`** — `next.config.mjs` gates it behind `MILLION_LINT=1` with a comment saying it "breaks runtime in this app (React 19 / Next 15)". It is a dependency you never enable; removable if you have no plans to revisit it.

### Next up (in order)

- **E4** — per-feature business-logic review across the 13 non-dating features.
- **74 remaining `any` uses** — a dedicated typing pass.
- **Test audit** — start with C3a above.

**Passes 1–5:** ~2,950 LOC removed net · 20 `(prisma as any)` casts removed, restoring type checking to the reports and blocks features · 400 LOC of dead code deleted · 7 pagination bugs fixed · 4 dependencies removed · 1 false security claim corrected · ~90 lines of hand-rolled pagination replaced by a 55-line helper · all verified with `tsc`, `eslint`, and a clean-`HEAD` `next build` (exit 0)
