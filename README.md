# Decibel Tribe

**Decibel Tribe:** The social network for musicians and industry pros. Find collaborators (drummers, photographers, bookers, merch), connect with peers, plan tours, and explore dating, all within a community that puts music first, DECIBEL TRIBE! Stay Human!

## Getting Started

Follow these steps to set up the project for local development.

### Prerequisites

- Node.js (See `.nvmrc` or `package.json` for version. Using [nvm](https://github.com/nvm-sh/nvm) is recommended.)
- npm (comes with Node.js)
- Git
- Access to a running PostgreSQL database instance.

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/petermsouzajr/decibel-tribe.git
    cd decibel-tribe
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**

    - Copy the example file: `cp .env.example .env`
    - **Edit `.env`** and fill in all required values, especially:
      - `POSTGRES_PRISMA_URL` (for migrations/Prisma Client)
      - `POSTGRES_URL_NON_POOLING` (for Prisma Studio/direct connections)
      - Stream Chat keys (`NEXT_PUBLIC_STREAM_KEY`, `STREAM_SECRET`)
      - Lucia secret (`LUCIA_SECRET_KEY`)
      - Google OAuth credentials (if needed for local testing)
      - UploadThing keys
      - _(Add any other critical env vars needed)_

4.  **Database Setup:**

    - Ensure your PostgreSQL database is running and accessible via the connection URL in `.env`.
    - Apply migrations to set up the schema:
      ```bash
      npx prisma migrate dev
      ```
    - (Optional, but recommended for development) Seed the database with test data:
      ```bash
      npm run db:seed
      ```

5.  **(Optional) View Database:**
    You can use Prisma Studio to view your local database:
    ```bash
    npx prisma studio
    ```

## Running Locally

Once setup is complete, start the development server:

```bash
npm run dev
```

The application should be accessible at `http://localhost:3000` (or the port specified in your `.env` or Next.js config).

## Testing

This project uses [Vitest](https://vitest.dev/) for unit, integration, and seed tests.

**E2E practice labs** (Cypress / Playwright) live in separate learner repos so testers can update specs without touching this app:

- [decibel-tribe-cypress-lab](https://github.com/petermsouzajr/decibel-tribe-cypress-lab)
- [decibel-tribe-playwright-lab](https://github.com/petermsouzajr/decibel-tribe-playwright-lab)

See [docs/E2E_LEARNER_LABS.md](./docs/E2E_LEARNER_LABS.md).

- **Run all developer-focused tests (Vitest - Unit, Integration, Seed):**
  ```bash
  npm run dev:test:all
  ```
- **Run comprehensive developer checks (Lint, Types, Tests, Build):**
  This is the recommended command to run before committing or pushing changes.
  ```bash
  npm run dev:check:all
  ```

For unit/integration commands (watch mode, UI, coverage), see [CONTRIBUTING.md](./CONTRIBUTING.md). For browser E2E, use the learner lab repos above.

## Contributing

Contributions are welcome! Please read our contribution guidelines and code of conduct before submitting pull requests.

- **[CONTRIBUTING.md](./CONTRIBUTING.md)**
- **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)**
