# Infrastructure & Technical Features

This document outlines the non-user-facing technical aspects, tooling, and infrastructure features identified in the Decibel Tribe application.

## Framework & Architecture

- **Framework:** Next.js (React framework)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (with PostCSS)
- **UI Components:** Shadcn UI (indicated by `components.json`, likely used for base components)
- **State Management:** React Query (`@tanstack/react-query`) for server state, caching, and synchronization.
- **API Routes:** Next.js API routes (`src/app/api/`) handle backend logic.

## Database & Data

- **ORM:** Prisma (`prisma/schema.prisma`)
- **Database:** (Likely PostgreSQL, common with Prisma, but needs confirmation from `schema.prisma` or `.env`)
- **Data Fetching:** `ky` instance (`src/lib/ky.ts`) used for making HTTP requests, likely configured for the application's API.

## Authentication & Authorization

- **Library:** Lucia Auth (`src/auth.ts`) for session management.
- **Password Hashing:** bcryptjs (indicated by `bcryptjs.d.ts`)
- **OAuth:** Google Sign-In implemented.
- **Email Verification:** Token-based email verification flow.

## Real-time Features

- **Chat:** Stream Chat (`stream-chat-react`, `stream-chat`) for real-time messaging.

## Development & Tooling

- **Package Manager:** npm (implied by `package-lock.json`)
- **Linting:** ESLint (`.eslintrc.json`)
- **Formatting:** Prettier (`prettier.config.js`)
- **Bundling/Building:** Next.js built-in tooling.
- **Environment Variables:** `.env` file for configuration.
- **Secrets Management:** GPG encrypted file (`googleCredentials.json.gpg`) suggests encryption for sensitive credentials.
- **Database Seeding:** Script (`prisma/seed.ts`) exists using Faker.js to populate the database with test data, including users, posts, groups, events, interactions, and Stream Chat synchronization.

## Testing

- **Unit/Integration Testing:** Vitest (`vitest.config.ts`)
- **End-to-End Testing:** Cypress (`cypress.config.ts`, `cypress/`)
- **Code Coverage:** nyc / Istanbul (`.nyc_output/`, `coverage/`)

## Deployment & CI/CD

- **Hosting:** Vercel (implied by `vercel.json` and common for Next.js)
- **CI/CD:** GitHub Actions (implied by `.github/` directory)

## Performance

- **Million.js:** Integrated (`.million/`, `next.config.mjs`) for potential performance optimizations.
