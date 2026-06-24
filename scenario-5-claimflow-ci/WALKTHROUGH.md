# Walkthrough — Claude Code CI Pipeline Demo

## Overview
This project demonstrates a simulated CI pipeline using Claude Code non-interactively to review a 14-file PR. The pipeline uses staged prompt refinement, split per-file and cross-file passes, and an independent reviewer instance to produce structured, actionable findings.

---

## Prompt 1: Non-Interactive Single File Review

**Exact command:**
```
claude -p "Review this file for real bugs only; ignore cosmetic style."
```

**What -p does:** Makes Claude run non-interactively — prints result and exits immediately. The pipeline never hangs waiting for a human.

**What CLAUDE.md adds:** Claude reads review criteria automatically every session — what to flag, what to skip, and the required JSON output format.

**Sample output:**
```json
[
  {
    "file": "src/routes/userRoutes.js",
    "line": 10,
    "severity": "HIGH",
    "issue": "GET /users has no authMiddleware — unauthenticated callers get all user records",
    "suggestedFix": "Add authMiddleware: router.get('/users', authMiddleware, async (req, res) => {...})"
  }
]
```

**Concepts proved:** 3.6 (Claude Code in CI/CD), 4.1 (explicit criteria reduce false positives)

---

## Prompt 2: Per-File Pass Then Cross-File Pass

**Per-file pass — run separately for each file:**
```
claude -p "Review src/auth/login.js for real bugs only. Output as JSON array: file, line, severity, issue, suggestedFix."
claude -p "Review src/routes/userRoutes.js for real bugs only. Output as JSON array: file, line, severity, issue, suggestedFix."
```

**Cross-file pass — run once across all files:**
```
claude -p "Review src/routes/userRoutes.js, src/middleware/authMiddleware.js, src/services/userService.js together. Flag cross-file inconsistencies only: routes that skip auth while others require it, services that assume req.user but routes that skip authMiddleware."
```

**Why two passes matter:**
- Per-file pass: each file gets full attention with no attention dilution across 14 files
- Cross-file pass: finds issues only visible when comparing files — a route skips authMiddleware but the service assumes req.user exists

**Cross-file finding caught (missed by per-file pass):**
```json
{
  "file": "src/routes/userRoutes.js",
  "line": 18,
  "severity": "HIGH",
  "issue": "DELETE route skips authMiddleware but userService.deleteUser assumes authenticated caller — cross-file security gap",
  "suggestedFix": "Add authMiddleware to DELETE /users/:id route"
}
```

**Concepts proved:** 1.6 (task decomposition), 4.6 (multi-instance/multi-pass review)

---

## Prompt 3: 14-File PR With Split Passes and Structured Output

**The 14 files reviewed:**
src/auth/login.js, src/config/config.js, src/db/connection.js, src/jobs/cleanupJob.js,
src/middleware/authMiddleware.js, src/models/User.js, src/routes/userRoutes.js,
src/scripts/seedDb.js, src/services/emailService.js, src/services/userService.js,
src/tests/integration/auth.test.js, src/tests/unit/userService.test.js,
src/types/index.js, src/utils/pagination.js

**Command — independent reviewer instance (fresh, no memory of writing the code):**
```
claude -p "You are an independent code reviewer with no prior context about this codebase. Review ALL 14 files for real bugs only. Flag: missing error handling, hardcoded secrets, auth bypasses, SQL injection, unhandled async, null dereference. Skip cosmetic issues. Output as JSON array: file, line, severity, issue, suggestedFix."
```

**Why independent instance catches more:**
A fresh claude -p call has no memory of writing the code. Self-review is biased — the author's eye skips issues they introduced. An independent instance with no session context reviews with fresh judgment.

**Prompt refinement stages shown:**
- ci-review/prompts/v1-broad.txt — broad prompt, noisy output with cosmetic nits
- ci-review/prompts/v2-explicit-criteria.txt — adds flag/skip criteria, eliminates false positives
- ci-review/prompts/v3-few-shot.txt — adds example input/output pairs, highest precision

**Few-shot example from v3 prompt (Task 4.2):**
Showing Claude an example of what to flag vs skip calibrates its judgment before it reviews any real code. This is few-shot prompting — examples teach the model the right behavior without retraining.

**Structured output (machine-postable as PR comments):**
See review-output/findings_20260625_003442.json

**Concepts proved:** 3.4 (plan vs direct), 3.5 (iterative refinement), 4.1 (explicit criteria), 4.2 (few-shot prompting), 4.6 (multi-pass review)

---

## How It All Connects

| Step | What | Why |
|------|------|-----|
| claude -p flag | Non-interactive mode | Pipeline never hangs |
| v1 → v2 → v3 prompts | Staged refinement | Eliminates false positives |
| Per-file pass | Each file reviewed fully | No attention dilution |
| Cross-file pass | Compare files together | Catches cross-file bugs |
| Independent instance | Fresh claude -p, no session | Avoids self-review bias |
| CLAUDE.md | Project context auto-loaded | Consistent team standards |
| JSON output | file, line, severity, issue, fix | Machine-postable to PR |
