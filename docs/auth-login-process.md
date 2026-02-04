## DecibelTribe Auth / Login Process (handoff doc)

This document describes **how authentication works in this repo** (DecibelTribe), including:
- Email/password signup + email verification
- Username/email + password login
- Google OAuth login
- Session cookies + refresh/clearing in Next.js App Router
- “Forgot password” / resend verification behavior (current implementation)
- Logout + redirects
- Relevant versions + required environment variables

---

## Stack + versions (from `package.json`)

- **Next.js**: `^15.5.7` (App Router)
- **React**: `^19.2.1`
- **TypeScript**: `^5.9.3`
- **Lucia**: `^3.2.0`
- **@lucia-auth/adapter-prisma**: `^4.0.1`
- **Arctic** (OAuth helpers): `^1.9.1`
- **Prisma**: `^7.2.0`
- **@prisma/client**: `^7.2.0`
- **@prisma/adapter-pg**: `^7.2.0`
- **pg**: `^8.16.3`
- **bcryptjs**: `^2.4.3`
- **zod**: `^3.23.8`
- **nodemailer**: `^7.0.12`

---

## High-level architecture

### Session/auth core
- **Lucia** is the session manager.
- Sessions are stored in the DB via Prisma (`session` model), using:
  - `src/auth.ts` → `new Lucia(new PrismaAdapter(prisma.session, prisma.user), …)`

### Next.js App Router cookie constraint (important)
- In Next.js App Router:
  - **Server Components** can **read** cookies but should not **mutate** cookies.
  - Cookie mutation should occur in a **Route Handler** or **Server Action**.

This repo follows that by:
- Providing `validateRequest()` (read-only; safe in Server Components)
- Providing `validateRequestWithCookieMutation()` (Route Handlers / Server Actions only)
- Using a client “sync” component:
  - `src/components/SessionCookieSync.tsx` → calls `POST /api/auth/session`
  - `src/app/api/auth/session/route.ts` → runs `validateRequestWithCookieMutation()` and returns `204`

---

## Environment variables (required)

### Database (Prisma 7 runtime adapter)
The app runtime expects one of:
- `POSTGRES_PRISMA_URL` (preferred; pooled)
- `POSTGRES_URL_NON_POOLING` (fallback; direct)

### Base URL (email verification + OAuth callback)
- `NEXT_PUBLIC_BASE_URL` (used to build verification links and OAuth redirect URI)

### Google OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Email (verification email via Nodemailer/Gmail)
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`

### Stream Chat (used on signup flows)
- `NEXT_PUBLIC_STREAM_KEY`
- `STREAM_SECRET`

---

## Key files

### Core auth primitives
- `src/auth.ts`
  - configures `lucia` + cookie settings
  - exports `validateRequest()` and `validateRequestWithCookieMutation()`

### Signup / verification
- `src/app/(auth)/signup/actions.ts` (Server Action)
- `src/app/(auth)/sendVerification.ts` (creates user + token and sends email)
- `src/app/api/verify-email/route.ts` (token verification endpoint)
- `src/app/(auth)/forgot-pass/page.tsx` + `actions.ts` (resend verification; see notes)

### Login / logout
- `src/app/(auth)/login/actions.ts` (Server Action)
- `src/app/(auth)/actions.ts` (logout Server Action)

### Google OAuth
- `src/app/(auth)/login/google/route.ts` (starts OAuth, sets state+verifier cookies)
- `src/app/api/auth/callback/google/route.ts` (handles callback, creates or links user)

---

## Session cookie behavior (Lucia)

Configured in `src/auth.ts`:
- `expires: false` → session cookie is not a fixed “expires-at” cookie (session behavior is managed by Lucia)
- `secure: process.env.NODE_ENV === "production"`

Where cookies are set:
- **Email verify**: `/api/verify-email` sets a fresh session cookie and redirects to `/`
- **Login**: `login()` sets session cookie and redirects to `/`
- **Google callback**: sets session cookie and redirects to `/`
- **Logout**: invalidates session and clears cookie, then redirects to `/login`
- **Cookie refresh/clearing**: `POST /api/auth/session` (called by `SessionCookieSync`)

---

## Flow 1 — Email/password signup + email verification

### 1) User submits signup form
- UI: `src/app/(auth)/signup/SignUpForm.tsx` → calls `signUp()` server action.
- Action: `src/app/(auth)/signup/actions.ts`

### 2) `signUp()` validates input and prepares user
1. Validates with `signUpSchema` (`src/lib/validation.ts`)
2. Hashes password with `bcryptjs`
3. Generates a new userId with Lucia helper `generateIdFromEntropySize(10)`
4. Checks for existing username/email (case-insensitive)
5. Calls `generateAndSendVerification(userId, username, email, passwordHash)`

### 3) `generateAndSendVerification()` creates DB records + sends email
File: `src/app/(auth)/sendVerification.ts`

Inside a Prisma transaction:
- Create `User` row (username/displayName/email/passwordHash)
- Create `UserPreferences` row (currently created with schema defaults)
- Create `EmailVerification` row:
  - `token = crypto.randomUUID()`
  - `expiresAt = now + 24h`
- Upsert user into StreamChat

Then it sends verification email via `src/lib/sendEmail.ts` (Nodemailer/Gmail):
- Link format:
  - `${NEXT_PUBLIC_BASE_URL}/api/verify-email?token=<token>`

### 4) User clicks verification link
Endpoint: `GET /api/verify-email?token=...` (`src/app/api/verify-email/route.ts`)

Steps:
1. Finds `EmailVerification` record with matching token and `expiresAt >= now`
2. Sets `User.isVerified = true`
3. If `pendingEmail` exists, it moves it into `email` and clears `pendingEmail`
4. Deletes the `EmailVerification` record
5. Creates a Lucia session and sets session cookie
6. Redirects to `/`

**Redirects**
- Missing/invalid/expired token → redirects to `/` (no session created)

---

## Flow 2 — Username/email + password login

Action: `src/app/(auth)/login/actions.ts`

Steps:
1. Reads form fields (`username` and `password`)
2. Finds a user by:
   - `username` (case-insensitive) OR `email` (case-insensitive)
3. Deleted account handling:
   - If `deletedAt` is set, returns special error codes:
     - `ACCOUNT_DELETED_WITHIN_GRACE_PERIOD`
     - `ACCOUNT_DELETED_EXPIRED`
4. Requires `passwordHash` to exist
5. Validates password with `bcrypt.compare`
6. Creates Lucia session + sets cookie
7. Redirects to `/`

**Error handling**
- Returns `{ error: "Invalid username or password" }` for most auth failures
- Returns structured errors for deleted accounts (grace period flow)

---

## Flow 3 — Google OAuth login

### 1) Start OAuth
Endpoint: `GET /login/google` (`src/app/(auth)/login/google/route.ts`)

Steps:
1. Generates:
   - `state`
   - `code_verifier`
2. Creates Google authorization URL with Arctic:
   - scopes: `profile`, `email`
3. Sets cookies:
   - `state` (httpOnly, sameSite=lax, maxAge 10 min)
   - `code_verifier` (httpOnly, sameSite=lax, maxAge 10 min)
4. Redirects to Google

### 2) OAuth callback
Endpoint: `GET /api/auth/callback/google` (`src/app/api/auth/callback/google/route.ts`)

Steps:
1. Validates `code` + `state` vs stored cookies; ensures PKCE verifier exists
2. Exchanges code for tokens via Arctic (`google.validateAuthorizationCode`)
3. Fetches Google userinfo (`id`, `name`, `email`)
4. Finds existing user by:
   - `googleId == googleUser.id` OR `email == googleUser.email`
5. If existing user:
   - if `googleId` missing, updates user to link it
   - creates Lucia session cookie
   - redirects to `/`
6. If new user:
   - generates userId
   - generates unique username from `slugify(googleUser.name)` + random suffix if needed
   - creates `User` in a transaction + upserts StreamChat user
   - creates Lucia session cookie
   - redirects to `/`

---

## Flow 4 — Logout

Server action: `logout()` in `src/app/(auth)/actions.ts`

Steps:
1. Calls `validateRequest()` to get current session
2. `lucia.invalidateSession(session.id)`
3. Sets blank session cookie (`lucia.createBlankSessionCookie()`)
4. Redirects to `/login`

---

## “Forgot password” / reset password (current state)

**Important:** In this repo, `/forgot-pass` is currently implemented as **“Resend Verification Email”**, not a standard password reset with a reset token.

### UI
- Page: `src/app/(auth)/forgot-pass/page.tsx`
  - heading: “Resend Verification Email”

### Action
- `src/app/(auth)/forgot-pass/actions.ts` → `resendVerification()`

Behavior:
1. Looks up a user by email / pendingEmail / username
2. Calls `resendVerificationEmail()` (in `src/app/(auth)/sendVerification.ts`)
3. **Then sets `passwordHash: null` for the user**

⚠️ **Caveat:** Because login requires `user.passwordHash` to exist, setting it to `null` can prevent email/password login until a password is set again via the in-app “Set Password” flow.

### Setting/changing password (in-app)
- UI dialog: `src/app/(main)/users/[username]/UpdatePasswordDialog.tsx`
- Server action: `updateUserPassword()` in `src/app/(main)/users/[username]/actions.ts`
  - Uses `bcryptjs` to hash
  - If user had no password set, it supports “Set Password” mode

---

## Redirect map (common)

- **Successful login** → `redirect("/")`
- **Successful email verification** → `NextResponse.redirect("/")`
- **Successful Google login** → `302 Location: /`
- **Logout** → `redirect("/login")`
- **Invalid verification token** → redirect to `/`

---

## Production hardening notes (for your master engineer)

- **Cookie mutation rules**: keep refresh/clear logic in route handlers/server actions (see `/api/auth/session`).
- **Verification enforcement**: login currently does **not** block unverified users. If your other app expects email verification before login, add a check on `user.isVerified`.
- **Password reset**: current “forgot pass” flow is *not* a standard reset flow. If you need conventional reset, implement:
  - password reset token table
  - email reset link
  - reset endpoint to set new passwordHash without requiring prior login


