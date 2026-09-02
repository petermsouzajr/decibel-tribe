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

### A2a. ⚠️ `UserPosts.tsx` — a lost feature, deliberately NOT deleted

`UserPosts.tsx` is a complete, working infinite-scroll component that fetches `/api/users/${userId}/posts`. Three facts together say this was dropped by accident, not retired:

1. It is the **only** caller of `/api/users/[userId]/posts` — and that route is live, maintained, and was just migrated to the pagination helper.
2. `UserProfilePage.tsx` renders **no posts section at all** — grepping it for `Post` returns nothing.
3. There is no successor. `UserPostsFeed` does not exist anywhere in the repo; it survives only in a commented-out mock in `UserProfilePage.test.tsx`.

So "view a user's posts on their profile" is a feature whose component and API route orphaned together. Deleting the component would also make the API route dead.

- [ ] **Decide:** restore it (render `<UserPosts userId={...} />` in `UserProfilePage.tsx`) or delete the component *and* `/api/users/[userId]/posts` together

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

### C1. API route boilerplate — the big one

**48 of 71 routes** re-implement the same auth guard. **98 places** return a 500. **67 route files** repeat `try/catch { console.error }`.

Current state in `src/app/api/posts/for-you/route.ts` — this is representative and it's the "random stuff" you mentioned:

```ts
// import { validateRequest } from "@/auth";      ← commented out
import { lucia } from "@/auth";                   // ← hand-rolled instead
...
// 25 lines of inline session validation, cookie refresh, and blank-cookie
// handling copy-pasted into the route
```

The project **has** a `validateRequest` helper. This route comments it out and inlines the whole thing. Some routes use the helper, some inline it — so session-refresh behaviour is not uniform across the API.

- [ ] Inventory which of the 48 routes use `validateRequest` vs. inline `lucia.validateSession`
- [ ] Build one wrapper, e.g. `withAuth(handler)` in `src/lib/api/` that does session validation + cookie refresh + the 401 + the try/catch + error logging once
- [ ] Migrate routes to it (do this in batches by feature, ticking Phase E below as you go)
- [ ] Normalise the 2 stragglers using `"Internal Server Error"` to match the 96 using `"Internal server error"` — or better, have the wrapper own the string so it cannot drift

**Estimated reduction:** ~25-30 lines × 48 routes ≈ **1,200+ LOC**, and it makes the pagination bugs in Phase D structurally impossible to repeat.

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

> `src/app/api/search/route.ts` also slices by `pageSize`, but it returns a fixed first page with no cursor at all. Not part of this family; deliberately left alone.

### C3. `getPostDataInclude` + `as unknown as PostData[]`

Several routes end with `posts.slice(0, pageSize) as unknown as PostData[]`. A double assertion through `unknown` means the Prisma result and `PostData` have genuinely diverged — the cast is silencing a real type mismatch rather than describing one.

- [ ] Find out whether `getPostDataInclude`'s inferred type actually matches `PostData`
- [ ] Fix the type so the assertion can be deleted (use Prisma's `GetPayload` generics rather than a hand-written interface)

### C4. `compatibility.ts` vs. inline scoring

`src/lib/dating/compatibility.ts` (207 LOC) is unreferenced, while `src/app/api/dating/matches/[matchId]/insights/route.ts:74` has a `// Calculate compatibility scores` comment.

- [ ] Determine whether the route re-implements the helper. If yes: the **route** is keep-forever backend, the helper is dead — so port the good version *into* the route (or into a `lib/server/` helper the route imports) and delete the orphan. Don't just delete blindly here; the helper may be the better implementation.

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

### D4. Two cleanup cron routes exist, are tested, and are **never scheduled** — **VERIFIED**

`vercel.json` schedules only two crons:

```json
{ "path": "/api/clear-uploads",           "schedule": "0 2 * * *" }
{ "path": "/api/clear-unverified-users",  "schedule": "0 1 * * *" }
```

But four `clear-*` routes exist. **`/api/clear-expired-deleted-users` and `/api/clear-expired-tokens` are never invoked by anything.**

This is worse than dead code, because `clear-expired-deleted-users` even has a passing unit test (`vitest/tests/unit/api/clear-expired-deleted-users.test.ts`) — so the suite is green and the job has never run in production. Per `docs/USER_DELETION_IMPLEMENTATION_SUMMARY.md` this is the job that purges soft-deleted accounts after their retention window. If so, deleted user data is being retained indefinitely, which is a data-retention commitment you may be making in the privacy policy.

- [ ] Confirm intent for `clear-expired-deleted-users` — schedule it, or delete the route + test
- [ ] Confirm intent for `clear-expired-tokens` — same
- [ ] Check whether the privacy policy promises a deletion window that isn't being honoured

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

Phase A/B/C/D above came out of a codebase-wide sweep. This grid is the remaining per-feature detail work. For each feature: confirm no dead code beyond Phase A, apply the C1 wrapper, check the "better way" column, confirm test coverage.

Legend: **Dead** = feature-local dead code swept · **DRY** = migrated to C1/C2 helpers · **Impl** = implementation reviewed · **Test** = coverage confirmed

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
| A — Dead code | non-dating | **done** — 5 files + 7 empty dirs + 4 orphan types removed; 1 item needs your call |
| B — Dependencies | non-dating | **done** — 4 packages removed, privacy policy corrected; `jest` deferred |
| C — DRY | C2 pagination | **done** — helper built, 12 routes migrated. C1/C3/C4 outstanding |
| D — Bugs | pagination | **done** — 7 broken routes fixed. D4 (crons) needs your call |
| E — Per-feature | 13 non-dating features | not started |
| F — Testing | — | deferred to its own audit |

### ⚠️ Dependency removals are in the working tree but **not committed**

`package.json` is entangled: it holds both this pass's four removals *and* your uncommitted `"dating-shared": "file:../dating-shared"` line. They cannot be separated cleanly, because `package-lock.json` would then disagree with `package.json` and `npm ci` fails on mismatch.

`file:../dating-shared` is a **local path** dependency. Committing it means `npm ci` on Vercel tries to resolve a directory that does not exist in the deploy environment, and the install fails before the build even starts. So committing `package.json` as it stands would break deploys for a reason unrelated to this audit.

**Left uncommitted deliberately.** `bcrypt`, `@types/bcrypt`, `argon2` and `faker` are already uninstalled from `node_modules` and removed from your working `package.json` — the work is done and verified, just not in the commit.

- [ ] Once the `dating-shared` question is settled, commit the dependency removals separately (`npm install` first so the lockfile matches)

### Still open, needing a decision from you

1. **`UserPosts.tsx` (A2a)** — restore the profile posts feed, or delete it *and* its API route together?
2. **Unscheduled crons (D4)** — `clear-expired-deleted-users` and `clear-expired-tokens` have never run in production. The first one purges soft-deleted accounts, so deleted-user data is being retained indefinitely. Schedule them, or delete them?
3. **Uncommitted dating edits** — `BasicFiltersPanel.tsx` and `DatingPreferencesForm.tsx` still hold uncommitted changes to files nothing imports.
4. **Broken build** — 11 uncommitted `dating-shared` imports break `next build` (`createContext` without `"use client"`). Unrelated to this pass, but it blocks deploys today.

### Next up (in order)

- **C1** — the `withAuth` wrapper: 48 routes duplicate the auth guard, 98 duplicate the 500 handler. Biggest remaining win, ~1,200 LOC.
- **C3** — kill the `as unknown as PostData[]` double assertions by fixing `getPostDataInclude`'s inferred type.
- **E** — per-feature sweep across the 13 non-dating features.

**This pass:** 400 LOC of dead code deleted · 7 pagination bugs fixed · 4 dependencies removed · 1 false security claim corrected · ~90 lines of hand-rolled pagination replaced by a 55-line helper · all verified with `tsc`, `eslint`, and a clean-`HEAD` `next build` (exit 0)
