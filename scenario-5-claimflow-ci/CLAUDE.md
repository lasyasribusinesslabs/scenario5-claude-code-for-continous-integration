# ClaimFlow CI — Claude Code Review Standards

> This file is read automatically by Claude Code every session.
> It defines what counts as a real bug vs a cosmetic nit.

## Project
ClaimFlow is a Node.js/Express SaaS with auth, user management, email, DB, and job scheduling.

## Review Criteria — Flag These (Real Bugs Only)
- Missing try/catch around async operations (unhandled rejection risk)
- Secrets or API keys hardcoded in source files
- Missing authentication/authorization checks on routes
- DB queries without error handling
- Unawaited async calls (silent failure)
- SQL injection or NoSQL injection risks
- Missing input validation before DB operations
- Broken or missing imports
- Undefined variables used before assignment
- Race conditions in async code

## Skip These (Cosmetic — Do NOT Flag)
- Naming style (camelCase vs snake_case preferences)
- Comment wording or missing comments
- Code formatting, indentation, spacing
- Personal preference on variable names
- File organization opinions

## Output Format (Required)
Every finding must be a JSON object:
{
  "file": "src/routes/userRoutes.js",
  "line": 23,
  "severity": "HIGH",
  "issue": "Async DB call not wrapped in try/catch — unhandled rejection will crash process",
  "suggestedFix": "Wrap User.findById() in try/catch and pass error to next()"
}

Severity levels: HIGH (crashes/security), MEDIUM (data loss risk), LOW (edge case bugs)
