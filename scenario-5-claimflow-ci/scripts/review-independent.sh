#!/bin/bash
# Step 4: Independent reviewer instance
# Demonstrates: fresh Claude instance with NO memory of writing the code
# Self-review is biased — independent review catches what authors miss

echo "=== INDEPENDENT REVIEWER INSTANCE ==="
echo "Launching fresh Claude instance with no session context"
echo "This simulates an independent code reviewer who did not write the code"
echo ""

claude -p "You are an independent code reviewer. You have no prior context about this codebase.
Review ALL files in the src/ directory for real bugs only.
You are looking for issues that the original developer might have missed because they wrote the code.

Focus on:
1. Security vulnerabilities (auth bypass, injection, hardcoded secrets)
2. Unhandled async errors that will crash the process silently
3. Missing input validation that could cause data corruption
4. Broken error propagation (errors swallowed, not passed to next())

Do NOT flag: style, naming, formatting, comments.

Output as JSON array with fields: file, line, severity, issue, suggestedFix.
At the end add a summary field: { 'summary': 'X HIGH, Y MEDIUM, Z LOW issues found' }" \
  --output-format json \
  > review-output/independent-review-result.json 2>&1

echo "Independent review complete. Results in review-output/independent-review-result.json"
cat review-output/independent-review-result.json
