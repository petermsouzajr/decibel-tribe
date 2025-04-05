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
  - [Branching](#branching)
  - [Coding Style](#coding-style)
  - [Commit Messages](#commit-messages)
- [Testing](#testing)
  - [Unit & Integration Tests (Vitest)](#unit--integration-tests-vitest)
  - [End-to-End Tests (Cypress)](#end-to-end-tests-cypress)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it are governed by a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.
(Note: You may need to create a `CODE_OF_CONDUCT.md` file).

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
  - Run `npm run check-all` to check for Typescript errors, build errors, and formatting before pushing changes.
  - Ensure code passes linting before submitting a PR. Consider configuring your editor to format on save.
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

Testing is crucial for maintaining application quality. We use two main testing frameworks:

### Unit & Integration Tests (Vitest)

(Optional/Recommended) - Use crusor/rule `vt.mdc`

- Used for testing individual functions, components, hooks, and smaller integrations.
- Run tests: `npm run test`
- Run tests with coverage report: `npm run coverage`
- Find tests in the `tests/` directory or alongside components (`*.test.tsx`).
- **Requirement:** New features and bug fixes should ideally include corresponding Vitest tests. Focus on testing logic, edge cases, and component behavior from a user interaction perspective (using React Testing Library helpers).

### End-to-End Tests (Cypress)

(Optional/Recommended) - Use cursor/rule `cye2e.mdc`

- Used for testing complete user flows through the application UI.
- Find tests in the `cypress/e2e/` directory.
- Run tests interactively: `npm run cypress:open`
- Run tests headlessly (like in CI): `npm run cypress:run`
- **Requirement:** Significant new user-facing features or critical workflows (like authentication, core posting) should be covered by E2E tests.
- **Note:** E2E tests often require a specific database state. Utilize the seeding script (`npx prisma db seed`) or custom Cypress commands (`cypress/support/commands.ts`) that might interact with seeding or APIs for setup/teardown.

## Submitting Changes

1.  Ensure your code passes linting: `npm run lint`.
2.  Ensure all tests pass: `npm run test` and `npm run cypress:run`.
3.  Commit your changes following the [Commit Messages](#commit-messages) guidelines.
4.  Push your feature branch to your fork: `git push origin YOUR_BRANCH_NAME`.
5.  Open a **Pull Request (PR)** against the `main` branch of the original `petermsouzajr/decibel-tribe` repository.
6.  **Describe your changes** clearly in the PR description. Link any related GitHub issues (e.g., `Closes #123`).
7.  Ensure all **CI checks** (GitHub Actions) pass on your PR.
8.  Participate in the **code review** process and address any feedback promptly.
9.  Once approved and checks pass, a maintainer will merge your PR.

## Reporting Bugs

- Check if the bug has already been reported in [GitHub Issues](https://github.com/petermsouzajr/decibel-tribe/issues).
- If not, create a new issue.
- Provide a clear title and description, steps to reproduce, expected behavior, actual behavior, and environment details (browser, OS if relevant).

## Suggesting Enhancements

- Open an issue on GitHub.
- Clearly describe the enhancement, its potential benefits, and any proposed implementation ideas.

Thank you for contributing!
