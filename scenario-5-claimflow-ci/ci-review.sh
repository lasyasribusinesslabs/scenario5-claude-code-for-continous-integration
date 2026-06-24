#!/bin/bash
# CI Review Pipeline — demonstrates staged prompt refinement
# Step 1: -p flag makes Claude non-interactive (pipeline-safe)
# Step 2: Three prompt stages show iterative refinement
# Step 3: Split passes avoid attention dilution on 14 files
# Step 4: Independent instance avoids self-review bias

set -e

echo "================================================"
echo " ClaimFlow CI Review Pipeline"
echo " Demonstrates: claude -p non-interactive mode"
echo "================================================"
echo ""

# STAGE 1: Broad prompt (noisy — for comparison only)
echo "--- STAGE 1: Broad prompt (v1) ---"
echo "Prompt: $(cat ci-review/prompts/v1-broad.txt)"
echo ""
echo "Running: claude -p \"$(cat ci-review/prompts/v1-broad.txt)\" src/routes/userRoutes.js"
echo "[Stage 1 would produce noisy output including cosmetic nits]"
echo ""

# STAGE 2: Explicit criteria prompt (fewer false positives)
echo "--- STAGE 2: Explicit criteria prompt (v2) ---"
echo "Prompt adds: Flag only real bugs. Skip cosmetic style."
echo ""
echo "Running: claude -p with explicit criteria on src/routes/userRoutes.js"
echo "[Stage 2 skips cosmetic nits, flags only real bugs]"
echo ""

# STAGE 3: Few-shot prompt (highest precision)
echo "--- STAGE 3: Few-shot prompt (v3) — highest precision ---"
claude -p "$(cat ci-review/prompts/v3-few-shot.txt)

File: src/routes/userRoutes.js
$(cat src/routes/userRoutes.js)" \
  > review-output/stage3-single-result.json 2>&1 || true

echo "Stage 3 output (few-shot, structured):"
cat review-output/stage3-single-result.json
echo ""

# PROMPT 1 DEMO: Non-interactive single file review
echo "================================================"
echo " PROMPT 1: claude -p — non-interactive review"
echo "================================================"
echo 'Running: claude -p "Review this file for real bugs only; ignore cosmetic style."'
echo ""
claude -p "Review src/routes/userRoutes.js for real bugs only; ignore cosmetic style. Output as JSON array with fields: file, line, severity, issue, suggestedFix." \
  > review-output/prompt1-result.json 2>&1 || true
cat review-output/prompt1-result.json
echo ""

# PROMPT 2 DEMO: Per-file pass then cross-file pass
echo "================================================"
echo " PROMPT 2: Per-file pass vs Cross-file pass"
echo "================================================"
echo "--- Per-file pass (each file reviewed independently) ---"
for file in src/auth/login.js src/routes/userRoutes.js src/services/userService.js src/middleware/authMiddleware.js; do
  echo "Reviewing: $file"
  claude -p "Review $file for real bugs only. Ignore cosmetic style. Output as JSON array: file, line, severity, issue, suggestedFix. Return [] if no bugs." \
    >> review-output/prompt2-per-file.json 2>&1 || true
done
echo "Per-file pass complete."
echo ""
echo "--- Cross-file pass (looks for inconsistencies ACROSS files) ---"
claude -p "Review these files together for cross-file inconsistencies only: src/routes/userRoutes.js, src/middleware/authMiddleware.js, src/services/userService.js. Flag: routes that skip auth while others require it, inconsistent error handling patterns, services that assume req.user but routes that skip authMiddleware. Output as JSON array: file, line, severity, issue, suggestedFix." \
  > review-output/prompt2-cross-file.json 2>&1 || true
echo "Cross-file pass complete."
cat review-output/prompt2-cross-file.json
echo ""

# PROMPT 3 DEMO: 14-file PR with split passes and structured output
echo "================================================"
echo " PROMPT 3: 14-file PR — split passes + structured output"
echo "================================================"
echo "Reviewing all 14 src files with independent reviewer instance..."
claude -p "You are an independent code reviewer with no prior context about this codebase. Review ALL of these files for real bugs only: src/auth/login.js, src/config/config.js, src/db/connection.js, src/jobs/cleanupJob.js, src/middleware/authMiddleware.js, src/models/User.js, src/routes/userRoutes.js, src/scripts/seedDb.js, src/services/emailService.js, src/services/userService.js, src/tests/integration/auth.test.js, src/tests/unit/userService.test.js, src/types/index.js, src/utils/pagination.js. Flag only: missing error handling, hardcoded secrets, auth bypasses, SQL injection, unhandled async, null dereference. Skip all cosmetic issues. Output as JSON array with fields: file, line, severity, issue, suggestedFix." \
  > review-output/prompt3-full-pr.json 2>&1 || true

echo "Structured findings:"
cat review-output/prompt3-full-pr.json
echo ""
echo "================================================"
echo " Pipeline complete — no hanging, structured output"
echo "================================================"
