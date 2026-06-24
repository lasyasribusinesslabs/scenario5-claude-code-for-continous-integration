#!/bin/bash
# Step 1: Non-interactive single file review using -p flag
# Demonstrates: claude -p makes Claude print result and exit (no hanging)

echo "=== SINGLE FILE REVIEW ==="
echo "Running: claude -p with explicit bug criteria on one file"
echo ""

claude -p "Review src/routes/userRoutes.js for real bugs only.
Ignore cosmetic style issues completely.
Flag only: missing error handling, auth issues, hardcoded secrets, unhandled async, missing validation.
Output as a JSON array. Each item must have: file, line, severity, issue, suggestedFix." \
  --output-format json \
  > review-output/single-file-result.json 2>&1

echo "Output written to review-output/single-file-result.json"
cat review-output/single-file-result.json
