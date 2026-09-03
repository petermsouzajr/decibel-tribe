---
name: QA Regression run
about: One manual regression / release test run — suite checklist + results (TestRail run-style)
title: "[Regression] "
labels: ["qa", "regression"]
---

## Run ID
<!-- e.g. REG-2026-08-18-staging -->

## Purpose
- [ ] Pre-release / staging sign-off
- [ ] Post-deploy prod verify
- [ ] Smoke only
- [ ] Full regression
- [ ] Hotfix verify

## Build under test
| Field | Value |
|-------|--------|
| App / repo | |
| Environment | staging / prod / preview |
| URL | |
| Git SHA / tag | |
| Deploy time | |
| Related PR(s) | |

## Scope
**In scope:**
- 

**Out of scope:**
- 

## Entry criteria
- [ ] Deploy is reachable
- [ ] Test accounts / data ready
- [ ] Known blockers documented
- [ ] Flow cases linked or listed below

## Suite checklist
<!-- Link [Flow] issues or paste case IDs. Check when done. -->

| Done | Case ID / Flow issue | Priority | Result | Notes |
|------|----------------------|----------|--------|-------|
| [ ] | | P0 | PASS / FAIL / BLOCKED / SKIP | |
| [ ] | | P0 | | |
| [ ] | | P1 | | |
| [ ] | | P1 | | |
| [ ] | | P2 | | |

## Defects found this run
| Severity | Title | Issue link | Blocks ship? |
|----------|-------|------------|--------------|
| | | | Y/N |

## Summary
| Metric | Count |
|--------|------:|
| Total cases planned | |
| Passed | |
| Failed | |
| Blocked | |
| Skipped | |

**Overall result:** PASS / FAIL / PASS WITH KNOWN ISSUES

## Ship gate (Pete org)
- [ ] Automated tests green (CI link: )
- [ ] P0 flows PASS
- [ ] Tester sign-off (name/date):
- [ ] Pete manual verify complete
- [ ] Explicit **ship it** from Pete
- [ ] Prod verify run filed (if this was staging): link

## Sign-off
| Role | Name | Date | Notes |
|------|------|------|-------|
| Tester | | | |
| Pete (human verifier) | | | |

## Evidence
- Screenshots / video:
- Logs:
- Extra notes:
