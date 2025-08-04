# Cypress Single Test Debugging Workflow (AI-Led)

This document outlines a workflow where the AI assistant takes the lead in identifying and fixing failures within a **single, specified** Cypress E2E test file. PLEASE ALSO CONSULT: .cursor/rules/cye2e.mdc

## 1. Goal

To efficiently debug a specific Cypress test (`.cy.ts` file), determine the validity and value of failing steps/assertions, and either fix the test, propose a fix for the application, or remove non-essential failing parts of the test.

## 2. Initiate the Workflow

Start by asking the AI assistant (like me) to begin the Cypress debugging workflow, **clearly specifying the relative path** to the target test file.

**User Prompt Example:**

```text
Please start the Cypress debugging workflow for cypress/e2e/ui/authentication/login_flow.cy.ts
```

## 3. Iterative Debugging Workflow

1.  **AI Executes the Specified Test:**

    - The AI will run the following command in your terminal, replacing `<path/to/your/test.cy.ts>` with the path you provided:
      ```bash
      npx cypress run --spec <path/to/your/test.cy.ts> --headless --reporter spec
      ```
      - `--spec <path>`: Targets only the specified test file.
      - `--headless`: Runs Cypress without launching the browser UI.
      - `--reporter spec`: Provides detailed output suitable for analysis.
    - The AI will monitor the command's output for success or failure.

2.  **Check Result:**

    - **If Pass:** The AI reports that the specified test passed successfully. The workflow ends.
    - **If Fail:** The AI proceeds to the analysis step.

3.  **AI Analyzes Failure:**

    - The AI examines the Cypress error output (command log, error message, stack trace) from the failed run.
    - The AI attempts to determine the likely cause:
      - Incorrect test logic/assertion.
      - Brittle or incorrect element selector (`cy.get(...)`).
      - Timing issue (element not ready, API call not finished - often requires waiting for `cy.intercept` alias).
      - Legitimate application bug (frontend rendering error, unexpected backend response).
      - Test environment/setup issue (incorrect data seeding, missing prerequisite state).
    - The AI assesses the **value and validity** of the _specific failing step or assertion_. Is it testing a critical part of the user flow? Is the assertion reasonable? Or is it testing an implementation detail or something redundant/unimportant?

4.  **AI Decides and Acts:** Based on the analysis:

    - **Scenario A: Test Fixable & Valuable Failure**

      - If the failure seems due to **test logic, selectors, or timing**, and the failing part is deemed **valuable**, the AI will:
        1.  **Read** the relevant section of the specified test file.
        2.  **Propose and Explain** a fix to the test code (e.g., update selector, add `cy.wait('@apiAlias')`, adjust assertion).
        3.  **Apply** the fix using code editing tools.
        4.  **Return to Step 1** (Re-run the _same_ test file).

    - **Scenario B: Application Bug & Valuable Failure**

      - If the test code appears **correct and valuable**, but the application is behaving unexpectedly (e.g., wrong element rendered, API returns error when it shouldn't), the AI will:
        1.  **Read** the relevant section of the test file.
        2.  **Explain** why it suspects an application bug, referencing the test code and the unexpected outcome.
        3.  **Propose a fix** for the _application code_ (describe the needed change, but **do not** attempt to implement it in the app).
        4.  **Report** the findings and proposed application fix. The workflow ends for this test.

    - **Scenario C: Low Value Failure**

      - If the specific failing step or assertion is deemed **low-value**, **brittle**, or **not essential** to the core purpose of the test (e.g., testing minor text formatting, overly specific CSS class), the AI will:
        1.  **Read** the relevant section of the test file.
        2.  **Explain** why the failing part is considered low-value or problematic.
        3.  **Propose and Explain** removing or commenting out _only the specific failing lines_ (not the entire `it` block unless the whole test is valueless).
        4.  **Apply** the removal/commenting using code editing tools.
        5.  **Return to Step 1** (Re-run the _same_ test file).

    - **Scenario D: Cannot Fix Test / Unclear Cause**
      - If the AI fails to fix the test after **2-3 attempts** on the same logical failure, or cannot confidently determine the cause/validity, it will:
        1.  **Report** the original failure and the fixes attempted.
        2.  **State** it cannot resolve the issue in the test file.
        3.  The workflow ends for this test, requiring user intervention.

5.  **Loop or Conclude:** The process repeats from Step 1 after a test fix (Scenario A) or removal (Scenario C) until the test passes, an application bug is proposed (Scenario B), or the AI cannot resolve the issue (Scenario D).
