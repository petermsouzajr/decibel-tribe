# Decibel Tribe

## Stay Human

to install dependencies
`npm install --legacy-peer-deps`

view local prisma db
`npm prisma studio`

to send new db model info to the db
`npm prisma db push`

to run local dev
`npm run dev`

## Testing and Code Coverage

### Unit/Integration Tests (Vitest)

To run Vitest tests and generate a coverage report:

```bash
npm run test -- --coverage
```

This uses the `test` script defined in `package.json` and passes the `--coverage` flag to Vitest. Reports are generated in the `./coverage/vitest/` directory.

### End-to-End Tests (Cypress)

To run Cypress tests with code coverage instrumentation:

```bash
npm run cy:run:coverage
```

This command uses `start-server-and-test` to:

1. Start the Next.js development server with code instrumentation enabled (`BABEL_ENV=instrumented`).
2. Wait for the server to be ready on `http://localhost:3000`.
3. Execute the `npm run cypress:run` command (which runs your Cypress tests).

Coverage reports are generated in the `./coverage/cypress/` directory (raw data in `.nyc_output/`).
