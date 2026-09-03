# Contributing to Decibel Tribe

First off, thank you for considering contributing to Decibel Tribe! We welcome contributions from the community. Whether it's reporting a bug, discussing improvements, or submitting a pull request, your help is valued.

This document provides guidelines for contributing effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
- [How to Contribute](#how-to-contribute)
- [Development Process](#development-process)
  - [Workflow Summary TL;DR](#typical-developer-workflow-summary)
  - [Branching](#branching)
  - [Coding Style](#coding-style)
  - [Commit Messages](#commit-messages)
  - [Unit Tests (Vitest)](#developer-tests-vitest)
  - [Submitting Changes](#submitting-changes)
- [End-to-End Tests (learner labs)](#end-to-end-tests-learner-labs)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it are governed by a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

## Getting Started

### Prerequisites

- Node.js (Check `.nvmrc` or `package.json` engines field for required version)
- npm (comes with Node.js)
- Git
- Access to a PostgreSQL database

### Setup

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally: `git clone https://github.com/YOUR_USERNAME/decibel-tribe.git`
3.  **Navigate** to the project directory: `cd decibel-tribe`
4.  **Install dependencies:** `npm install`
5.  **Environment Variables:**
    - Copy the example environment file: `cp .env.example .env`
    - **Crucially, fill in the required values in `.env`**: This includes your `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, Stream Chat keys (`NEXT_PUBLIC_STREAM_KEY`, `STREAM_SECRET`), Lucia secret (`LUCIA_SECRET_KEY`), UploadThing keys, Google OAuth credentials, etc.
6.  **Database Setup:**
    - Ensure your PostgreSQL server is running and accessible via the connection string in `.env`.
    - Apply database migrations: `npx prisma migrate dev`
    - (Optional but Recommended) Seed the database with test data: `npx prisma db seed`
7.  **Run the development server:** `npm run dev`

Now you should be able to access the application locally, typically at `http://localhost:3000`.

## How to Contribute

- **Issues:** Check the [GitHub Issues](https://github.com/petermsouzajr/decibel-tribe/issues) for existing bug reports or feature requests.
- **Propose Changes:** If you have an idea, consider opening an issue first to discuss it.
- **Pull Requests:** Submit PRs for bug fixes or approved features.

## Development Process

### Branching

- Create a new branch from the `main` branch for your changes.
- Use descriptive branch names, including the issue number if applicable.
  - Examples: `feat/add-password-reset-#123`, `fix/notification-type-error-#456`, `refactor/profile-component`

### Coding Style

- **TypeScript:** Follow standard TypeScript best practices.
- **Linting & Formatting:** This project uses ESLint for linting and Prettier for formatting.
  - Run **`npm run dev:check:types`**: **(Recommended Check)** Runs all the above static analysis checks (`dev:lint`, `dev:types:src`, `dev:types:vitest`). Useful to run after development.
    - `npm run dev:lint` checks application code style.
    - `npm run dev:types:src` and `npm run dev:types:vitest` check TypeScript types in the app and Vitest tests respectively.
  - Ensure code passes these checks before submitting a PR. Consider configuring your editor to format on save using Prettier.
- **Component Structure:** Follow existing patterns for component organization and naming conventions.
- **Accessibility:** Keep accessibility (a11y) in mind when creating UI components.

### Commit Messages

Please follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages. This helps in automating changelogs and understanding the commit history.

- **Format:** `<type>[optional scope]: <description>`
- **Examples:**
  - `feat: add user blocking functionality`
  - `fix(auth): resolve type error in notification component`
  - `refactor(profile): simplify user data fetching`
  - `test(posts): add unit tests for Post component`
  - `docs: update contributing guidelines`

## Testing

Testing is crucial for maintaining application quality. This section focuses on commands for _executing_ tests.

### Developer Tests (Vitest)

(Optional/Recommended) - Use cursor/rule `vt.mdc` for Vitest Expert Prompt and `vitest/VITEST_DEBUGGING_WORKFLOW.md` to trigger a vitest debuging workflow for vitest unit tests.

- Used for testing individual functions, components, hooks, smaller integrations, and database seed logic.
- Tests are typically found in the `vitest/tests/` directory, alongside components (`*.test.tsx`), or in the `prisma/` directory for seed tests.
- **Comprehensive Pre-Commit/Push Check:**
  - **`npm run dev:check:all`**: **(Strongly Recommended Before Committing/Pushing)** This command bundles static analysis (`dev:check:types`), runs all developer tests (`dev:test:all`), and attempts a production build (`build`). It's the best way to ensure your changes integrate correctly before sharing them.
- **Granular Execution Commands:**
  - `npm run dev:test:unit`: Runs application unit/integration tests once.
  - `npm run dev:test:seed`: Runs database seed script tests once.
  - `npm run dev:test:unit:watch`: Runs unit/integration tests in interactive watch mode (useful during development).
  - `npm run dev:test:unit:ui`: Opens the Vitest UI for interactive debugging.
  - `npm run dev:test:unit:coverage`: Runs unit/integration tests and generates a coverage report.
- **Combined Test Execution Command:**
  - **`npm run dev:test:all`**: **(Recommended for Developers)** Runs all developer-focused tests (`dev:test:unit` and `dev:test:seed`).
- **Requirement:** New features and bug fixes should ideally include corresponding Vitest tests. Focus on testing logic, edge cases, and component behavior.

### End-to-End Tests (learner labs)

Browser E2E (Cypress and Playwright) is **not** maintained inside this application repo.

Learners and QA practice against the deployed Decibel Tribe app from:

- https://github.com/petermsouzajr/decibel-tribe-cypress-lab
- https://github.com/petermsouzajr/decibel-tribe-playwright-lab

Default SUT: `https://www.decibeltribe.com` (override with `CYPRESS_BASE_URL` / `PLAYWRIGHT_BASE_URL`).

See [docs/E2E_LEARNER_LABS.md](./docs/E2E_LEARNER_LABS.md).


## Submitting Changes

1.  Run relevant checks before committing. **We strongly recommend running `npm run dev:check:all`** to catch most application-related issues (linting, types, unit tests, build errors).
2.  Commit your changes following the [Commit Messages](#commit-messages) guidelines.
3.  Push your feature branch to your fork: `git push origin YOUR_BRANCH_NAME`.
4.  Open a **Pull Request (PR)** against the `main` branch of the original `petermsouzajr/decibel-tribe` repository.
5.  **Describe your changes** clearly in the PR description. Link any related GitHub issues (e.g., `Closes #123`).
6.  Ensure all **CI checks** (GitHub Actions) pass on your PR. These checks will likely run commands like `dev:check`, `dev:test:all`, and potentially E2E tests.
7.  Participate in the **code review** process and address any feedback promptly.
8.  Once approved and checks pass, a maintainer will merge your PR.

## Reporting Bugs

- Check if the bug has already been reported in [GitHub Issues](https://github.com/petermsouzajr/decibel-tribe/issues).
- If not, create a new issue.
- Provide a clear title and description, steps to reproduce, expected behavior, actual behavior, and environment details (browser, OS if relevant).

## Suggesting Enhancements

- Open an issue on GitHub.
- Clearly describe the enhancement, its potential benefits, and any proposed implementation ideas.

Thank you for contributing!
