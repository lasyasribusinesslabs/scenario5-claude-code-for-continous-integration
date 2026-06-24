#!/bin/bash
# Step 3b: Cross-file pass — looks for inconsistencies ACROSS files
# Demonstrates: catching issues that per-file review misses

echo "=== CROSS-FILE PASS ==="
echo "Looking for cross-file inconsistencies: auth gaps, error handling patterns, secret management"
echo ""

claude -p "Review these files together as a set and look for cross-file issues only:
- src/auth/login.js
- src/routes/userRoutes.js
- src/middleware/authMiddleware.js
- src/services/userService.js
- src/services/emailService.js
- src/db/connection.js

Cross-file issues to flag:
- Some routes use auth middleware, others skip it (inconsistent security)
- Some services handle errors, others do not (inconsistent pattern)
- Secrets managed differently across files
- DB connection used directly in some files, through abstraction in others

Output as JSON array with fields: file, line, severity, issue, suggestedFix.
For cross-file issues, set file to the primary offending file." \
  --output-format json \
  > review-output/cross-file-result.json 2>&1

echo "Cross-file pass complete. Results in review-output/cross-file-result.json"
cat review-output/cross-file-result.json
