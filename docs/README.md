# Documentation index

Everything in `docs/` is **current** — guidance you can act on today.
Everything in `docs/archive/` is **history** — accurate when written, kept for
context, and no longer a source of truth. If a search turns up an archived file,
check this index for the live equivalent before acting on it.

---

## Current

### Direction
| Doc | What it is |
|-----|------------|
| [DATING_EXPO_MIGRATION_PLAN.md](DATING_EXPO_MIGRATION_PLAN.md) | **Approved.** Dating UI moves to the separate `datingtribe` Expo repo; decibel-tribe keeps `/api/dating/*` and the database. Supersedes the archived master plan on anything UI. |
| [CODEBASE_AUDIT_TRACKER.md](CODEBASE_AUDIT_TRACKER.md) | Live audit: what has been cleaned up, what is deliberately deferred, what still needs a decision. |

### Reference
| Doc | What it is |
|-----|------------|
| [auth-login-process.md](auth-login-process.md) | How login and session validation work. |
| [SCHEMA_NAMING_CONVENTIONS.md](SCHEMA_NAMING_CONVENTIONS.md) | Prisma model and field naming rules. |
| [USER_FEATURES.md](USER_FEATURES.md) | User-facing features as shipped. |
| [INFRASTRUCTURE_FEATURES.md](INFRASTRUCTURE_FEATURES.md) | Infrastructure and technical capabilities. |
| [MEDIA_CLEANUP_GUIDE.md](MEDIA_CLEANUP_GUIDE.md) | How orphaned uploads are pruned. |

### Seeding
| Doc | What it is |
|-----|------------|
| [SEED_DOCUMENTATION.md](SEED_DOCUMENTATION.md) | How to run and extend the seed. |
| [MODULAR_SEEDING_PLAN.md](MODULAR_SEEDING_PLAN.md) | Structure of the modular seed. |
| [ADDITIONAL_SEED_FUNCTIONS.md](ADDITIONAL_SEED_FUNCTIONS.md) | Extra seed helpers. |

### Proposals — not yet built
Read these as intent, not description. Check the code before assuming any of it exists.

| Doc | What it is |
|-----|------------|
| [COMMENT_IMPROVEMENT_PLAN.md](COMMENT_IMPROVEMENT_PLAN.md) | Proposed comment-system changes. |
| [REPORT_IMPLEMENTATION_PLAN.md](REPORT_IMPLEMENTATION_PLAN.md) | Reporting/moderation design. |
| [public-view-only-strategy.md](public-view-only-strategy.md) | Guest access strategy. |
| [verified-users-bot-prevention.md](verified-users-bot-prevention.md) | Verification and bot prevention. |
| [MISSING_BEST_PRACTICES.md](MISSING_BEST_PRACTICES.md) | Gaps worth closing. |

---

## Archive

Point-in-time records. Two kinds: **status snapshots** that were true on their
date, and **fix write-ups** describing work already merged.

| Doc | Why archived |
|-----|--------------|
| [DATING_MASTER_PLAN.md](archive/DATING_MASTER_PLAN.md) | **Actively contradicts current direction** — says the dating product will have no native app. Reversed by the Expo migration plan. Carries a banner saying so. |
| [DATING_FEATURE_COMPLETE.md](archive/DATING_FEATURE_COMPLETE.md) | Declared the dating feature production-ready; that UI is now being retired in favour of the Expo app. |
| [PROJECT_COMPLETION_STATUS.md](archive/PROJECT_COMPLETION_STATUS.md) | Status snapshot dated 2024. |
| [DATING_FILTER_FIXES.md](archive/DATING_FILTER_FIXES.md) | Fix write-up, merged. |
| [DATING_LIKE_DISLIKE_FLOW_ANALYSIS.md](archive/DATING_LIKE_DISLIKE_FLOW_ANALYSIS.md) | Analysis of code as it stood then. |
| [DATING_MIGRATION_NOTES.md](archive/DATING_MIGRATION_NOTES.md) | Notes for a migration already run. |
| [DATING_PREFERENCES_LOCATIONS.md](archive/DATING_PREFERENCES_LOCATIONS.md) | Code inventory, since drifted. |
| [UPLOADTHING_FIX.md](archive/UPLOADTHING_FIX.md) | Fix write-up, merged. |
| [SEED_ISSUES_AND_FIXES.md](archive/SEED_ISSUES_AND_FIXES.md) | Fix write-up, merged. |
| [USER_DELETION_IMPLEMENTATION_SUMMARY.md](archive/USER_DELETION_IMPLEMENTATION_SUMMARY.md) | Implementation record for shipped work. |

---

## Also at the repo root

[README.md](../README.md) · [CONTRIBUTING.md](../CONTRIBUTING.md) ·
[CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) ·
[TEAM_STRUCTURE.md](../TEAM_STRUCTURE.md) ·
[DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) ·
[DEVELOPMENT_QUICK_START.md](../DEVELOPMENT_QUICK_START.md)

> **Known dangling reference:** `DATING_EXPO_MIGRATION_PLAN.md` cites
> `docs/datingtribe-testflight-safe-deploy.md`, which does not exist in this
> repo — the surrounding text suggests it lives with the Hermes/`datingtribe`
> material. Left as-is rather than guessed at.
