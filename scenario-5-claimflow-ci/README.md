# Scenario 5 — ClaimFlow CI: Claude Code as a Code Reviewer

This project demonstrates how to integrate **Claude Code** (`claude -p`) into a CI pipeline to perform automated, multi-pass code review on a Node.js/Express API. It covers all six key CCAF Scenario 5 techniques.

---

## What This Demonstrates

| Technique | Where |
|-----------|-------|
| Non-interactive mode (`claude -p`) | `ci-review.sh` — every review call |
| Staged prompt refinement (v1 → v2 → v3) | `ci-review/prompts/` |
| Split passes (per-file + cross-file) | Pass 1 and Pass 2 in `ci-review.sh` |
| Independent review instances (no shared context) | Each `claude -p` call is isolated |
| Project context via `CLAUDE.md` | Root `CLAUDE.md` defines criteria and output format |
| Structured output (JSON schema) | `ci-review/schemas/findings.schema.json` |

---

## How to Run

```bash
bash ci-review.sh
```

Output is written to `review-output/findings_<TIMESTAMP>.json`.

**Requirements:** `claude` CLI must be on `$PATH`. `jq` is optional but recommended for JSON merging.

---

## Required Demo Prompts (Rubric)

### 1. Non-interactive per-file review
```bash
claude -p "Review this file for real bugs only; ignore cosmetic style." \
  --output-format text < src/auth/login.js
```

### 2. Per-file pass vs cross-file pass comparison
Run `bash ci-review.sh` and observe:
- **Pass 1** catches local bugs: SQL injection, missing auth, plaintext passwords, unhandled promises
- **Pass 2** catches cross-file issues: `UserResponse` type missing `createdAt` that `userRoutes.js` returns; `User.toJSON()` leaking password field consumed by API callers

### 3. 12+ file PR with split passes and structured output
The pipeline reviews **14 files** in Pass 1 and then runs a unified cross-file review in Pass 2. Final output conforms to `findings.schema.json`.

---

## Folder Structure

```
scenario-5-claimflow-ci/
├── CLAUDE.md                         # Project review criteria (auto-loaded by claude)
├── ci-review.sh                      # Main CI pipeline script
├── ci-review/
│   ├── prompts/
│   │   ├── v1-broad.txt              # Naive prompt — produces noisy output
│   │   ├── v2-explicit-criteria.txt  # Targeted prompt with explicit rules
│   │   └── v3-few-shot.txt           # Few-shot examples for consistent output
│   └── schemas/
│       └── findings.schema.json      # JSON Schema for structured findings
├── src/                              # Deliberately buggy ClaimFlow source files
│   ├── auth/login.js                 # SQL injection, plaintext password, no JWT expiry
│   ├── middleware/authMiddleware.js  # Auth bypass on error, full token exposure
│   ├── db/connection.js              # Pool misconfiguration, hardcoded password
│   ├── routes/userRoutes.js          # Unprotected routes, no try/catch
│   ├── services/userService.js       # SQL injection, null dereference
│   ├── services/emailService.js      # Hardcoded API key (otherwise clean)
│   ├── config/config.js              # Hardcoded JWT secret, CORS wildcard
│   ├── models/User.js                # Password exposed in toJSON, missing updatedAt
│   ├── jobs/cleanupJob.js            # Race condition, swallowed errors
│   ├── utils/pagination.js           # CLEAN — reviewer should output "No findings"
│   ├── types/index.js                # Missing createdAt in UserResponse typedef
│   ├── scripts/seedDb.js             # Hardcoded password, process.exit before pool.end
│   └── tests/
│       ├── unit/userService.test.js  # Missing null-path test, hardcoded credentials
│       └── integration/auth.test.js  # No SQL injection test, hardcoded password
└── review-output/                    # Generated reports land here
```

---

## Prompt Version Comparison

| Version | File | Behaviour |
|---------|------|-----------|
| v1 — Broad | `v1-broad.txt` | "Review for any issues." → flags cosmetic nits, style preferences, unnecessary suggestions |
| v2 — Explicit Criteria | `v2-explicit-criteria.txt` | Lists exactly what to flag and what to skip → much less noise, structured output |
| v3 — Few-Shot | `v3-few-shot.txt` | Adds concrete examples of a correct finding vs a skip → most consistent, production-ready output |

The pipeline uses **v3** by default. Swap `PROMPT_FILE` in `ci-review.sh` to compare prompt versions.

---

## Expected Findings Summary

| File | Severity | Issue |
|------|----------|-------|
| `src/auth/login.js` | Critical | SQL injection via string interpolation |
| `src/auth/login.js` | Critical | Plaintext password comparison |
| `src/auth/login.js` | Critical | JWT signed without `expiresIn` |
| `src/auth/login.js` | Critical | No try/catch — unhandled promise rejection |
| `src/middleware/authMiddleware.js` | Critical | `next()` called on JWT error — auth bypass |
| `src/db/connection.js` | Critical | Hardcoded DB password |
| `src/db/connection.js` | Major | Pool missing `max`, `idleTimeoutMillis`, `connectionTimeoutMillis` |
| `src/db/connection.js` | Major | No `pool.on('error')` handler |
| `src/routes/userRoutes.js` | Critical | GET /users has no auth middleware |
| `src/services/userService.js` | Critical | SQL injection in `getUserById` |
| `src/services/userService.js` | Critical | Null dereference in `deleteUser` |
| `src/services/emailService.js` | Critical | Hardcoded SendGrid API key |
| `src/config/config.js` | Critical | Hardcoded JWT secret |
| `src/config/config.js` | Major | CORS `*` not gated on `NODE_ENV` |
| `src/models/User.js` | Major | `toJSON()` exposes password field |
| `src/jobs/cleanupJob.js` | Major | Race condition: read + delete without transaction |
| `src/utils/pagination.js` | — | No findings (clean file) |
| `src/types/index.js` | Minor | `UserResponse` missing `createdAt` (cross-file) |
| `src/scripts/seedDb.js` | Minor | Hardcoded admin password; `process.exit` before pool close |
