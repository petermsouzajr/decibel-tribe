# Vitest Debugging Workflow (AI-Led)

This document outlines a workflow where the AI assistant takes the lead in identifying and fixing failing Vitest tests using Vitest's `verbose` reporter.

## 1. Initiate the Workflow

Start by asking the AI assistant (like me) to begin the Vitest debugging process.

**User Prompt Example:**

```text
Please start the Vitest debugging workflow.
```

## 2. The AI will run the following command in your terminal to generate it using the `verbose` reporter:

      ```bash
      npx vitest run --reporter=verbose > vitest/failing_tests.log 2>&1
      ```
      _(Note: Ensure the `vitest/` directory exists or the command might fail. You may need to create it manually: `mkdir vitest`. The `2>&1` ensures error messages are also captured in the log.)_
    - The AI will confirm once it has successfully run the command and the `vitest/failing_tests.log` file has been created.
    - After confirmation, the AI will attempt to read the file again.
    - If the file generation fails or the file is still not found, the AI will stop the process.

3.  **If `vitest/failing_tests.log` exists:** The AI will proceed to the next step.

## 3. Iterative Fixing Workflow (Test-by-Test)

1.  The AI will attempt to **read** `vitest/failing_tests.log` to identify the **file path** and **test description** of the **first test case** marked as failing.
    - Failing suites are typically marked with `FAIL` followed by the file path (e.g., `FAIL src/components/MyComponent.test.tsx`).
    - Specific failing test descriptions are usually listed below the `FAIL` line, often indented (e.g., ` FAIL should render correctly`).
    - The AI will parse the text output to extract this information for the first encountered failure.
2.  Once a failing test (file + description) is identified, the AI will inform you which test it is working on.
3.  The AI will **read** the relevant section of the specified test file containing the failing test.
4.  The AI will attempt to **fix** that specific test case. The goal is to make the test pass **without introducing new TypeScript or linter errors**.
5.  The AI will present the proposed fix and apply it (e.g., using code editing tools).
6.  The AI should then **run the tests** for that specific file (e.g., `npx vitest run path/to/file.test.tsx`) or ideally just the specific test (e.g., `npx vitest run -t "Test Description" path/to/file.test.tsx`) to verify:
    - The targeted test now passes.
    - No new errors (TypeScript, linter, or runtime) were introduced in the file.
7.  **AI Verifies & Reports:**
    - The AI runs the specific test command again.
    - **If Pass:**
      - The AI will acknowledge the success.
      - The AI will conceptually mark this test as fixed and look for the **next failing test** in the `vitest/failing_tests.log` file (by re-reading or continuing parsing).
      - The AI will proceed to step 2 with the next identified failing test. If no more failures are found, it reports completion.
    - **If Fail/New Error:**
      - The AI will acknowledge the issue and analyze the new error output.
      - The AI will attempt another fix for the _same test_ (up to 2-3 attempts total is reasonable).
      - The AI will return to step 5.
    - **If Too Complex:**
      - If the test cannot be fixed reliably after a few attempts, the AI will propose adding `.skip` to the test case (`it.skip(...)` or `test.skip(...)`).
      - The AI will apply the `.skip`.
      - Once the skip is applied, the AI will conceptually mark the test as skipped and proceed as if it passed (look for the next failing test).
8.  The process repeats from step 2 until the AI confirms no more failing tests are found in the report.
