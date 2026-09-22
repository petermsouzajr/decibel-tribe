# E2E learner labs (extracted)

Decibel Tribe is the **system under test**. Cypress and Playwright suites live in **separate repos** so learners can update tests without touching this app.

| Track | Repo | Default SUT |
|-------|------|-------------|
| Cypress | https://github.com/petermsouzajr/decibel-tribe-cypress-lab | https://www.decibeltribe.com |
| Playwright | https://github.com/petermsouzajr/decibel-tribe-playwright-lab | https://www.decibeltribe.com |

In-app `cypress/` and `playwright/` runners have been **removed** from this monorepo. Use the lab repos for courses and student PRs.

App CI here focuses on lint, types, Vitest, and build.
