#!/bin/bash
# Step 3a: Per-file pass — reviews each file independently
# Demonstrates: splitting large PR into per-file passes to avoid attention dilution

echo "=== PER-FILE PASS ==="
echo "Reviewing each src file independently to avoid attention dilution"
echo ""

ALL_FINDINGS="[]"

for file in src/auth/login.js src/routes/userRoutes.js src/services/userService.js src/services/emailService.js src/middleware/authMiddleware.js src/db/connection.js src/models/User.js src/config/config.js src/jobs/cleanupJob.js src/utils/pagination.js src/scripts/seedDb.js src/types/index.js src/tests/unit/userService.test.js src/tests/integration/auth.test.js; do
  echo "Reviewing: $file"
  claude -p "Review $file for real bugs only. Ignore cosmetic style.
Flag only: missing error handling, auth issues, hardcoded secrets, unhandled async, missing input validation.
Output as JSON array with fields: file, line, severity, issue, suggestedFix.
If no real bugs found, return empty array []." \
    --output-format json \
    >> review-output/per-file-results.json 2>&1
  echo "" >> review-output/per-file-results.json
done

echo ""
echo "Per-file pass complete. Results in review-output/per-file-results.json"
