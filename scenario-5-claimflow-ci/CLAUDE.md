# ClaimFlow — CI Code Review Context

## Project Overview

ClaimFlow is a Node.js + Express API service handling insurance claim submissions and user management. Code reviews must be **security-aware**, **production-focused**, and **actionable**. Flag real bugs only — not style preferences.

---

## Review Criteria

### FLAG THESE (real bugs only)

#### Critical — Block Merge
- SQL injection via string interpolation (e.g. `` `SELECT * FROM users WHERE id = ${id}` ``)
- Plaintext password storage or comparison (no bcrypt)
- Missing auth middleware on protected routes
- Null/undefined dereference without guard (e.g. `rows[0].field` without checking `rows[0]`)
- Unhandled promise rejections (async functions with no try/catch)
- Hardcoded secrets or credentials in application code
- JWT tokens signed without `expiresIn` option

#### Major — Should Fix Before Ship
- Missing input validation on route parameters or request bodies
- DB connection pool misconfiguration (no `max`, no `idleTimeoutMillis`, no `connectionTimeoutMillis`, no error handler)
- Race conditions in background jobs (read-then-write without a transaction)
- Error handlers that silently swallow exceptions (catch block with only a log and continue)
- API responses that expose the `password` field
- CORS set to `*` unconditionally (not gated on `NODE_ENV`)

#### Minor — Worth Noting, Fix in Follow-up
- Missing test cases for error or null paths
- `process.exit()` called before DB pool is properly closed
- Hardcoded credentials in test files or seed scripts
- Missing fields in shared type definitions that callers depend on

---

## DO NOT FLAG

- Cosmetic formatting (spacing, semicolons, trailing commas)
- Arrow function vs regular function declaration style
- Variable or function naming style
- Comment density or missing JSDoc
- Import ordering
- Code that "could be refactored" with no functional impact

---

## Severity Definitions

| Severity | Meaning | Action |
|----------|---------|--------|
| Critical | Security vulnerability, data loss risk, or crash path | Block merge |
| Major | Reliability or correctness issue | Fix before ship |
| Minor | Code quality issue | Fix in follow-up PR |

---

## Required Output Format

Every finding must use this exact structure:

```
File: <relative path>
Line: <line number or range>
Severity: <Critical | Major | Minor>
Issue: <one-sentence description of the actual problem>
Fix: <concrete suggested fix>
```

**Only output findings. No preamble, no summary paragraphs, no section headers.**

If no real issues are found in a file, output: `No findings.`
