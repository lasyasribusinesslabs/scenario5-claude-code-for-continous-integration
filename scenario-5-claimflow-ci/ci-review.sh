#!/usr/bin/env bash
set -e

# ─── Configuration ───────────────────────────────────────────────────────────
SRC_DIR=./src
OUTPUT_DIR=./review-output
PROMPT_FILE=./ci-review/prompts/v3-few-shot.txt
SCHEMA_FILE=./ci-review/schemas/findings.schema.json

# ─── Setup ───────────────────────────────────────────────────────────────────
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$OUTPUT_DIR/findings_${TIMESTAMP}.json"

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: Prompt file not found: $PROMPT_FILE" >&2
  exit 1
fi

PROMPT=$(cat "$PROMPT_FILE")

# ─── Files to review ─────────────────────────────────────────────────────────
FILES=(
  "src/auth/login.js"
  "src/middleware/authMiddleware.js"
  "src/db/connection.js"
  "src/routes/userRoutes.js"
  "src/services/userService.js"
  "src/services/emailService.js"
  "src/config/config.js"
  "src/models/User.js"
  "src/jobs/cleanupJob.js"
  "src/utils/pagination.js"
  "src/tests/unit/userService.test.js"
  "src/tests/integration/auth.test.js"
  "src/types/index.js"
  "src/scripts/seedDb.js"
)

echo "=================================================="
echo "  ClaimFlow CI Review Pipeline"
echo "  Files: ${#FILES[@]}  |  Timestamp: $TIMESTAMP"
echo "=================================================="

# ─── Temp workspace ──────────────────────────────────────────────────────────
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

# ══════════════════════════════════════════════════════════════════════════════
# PASS 1 — Per-file review (independent non-interactive instances)
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "[ PASS 1 ] Per-file review (${#FILES[@]} files)"
echo "--------------------------------------------------"

i=0
for FILE in "${FILES[@]}"; do
  if [ ! -f "$FILE" ]; then
    echo "  SKIP  $FILE (not found)"
    continue
  fi

  echo "  Reviewing  $FILE ..."

  # Each file gets a fresh, non-interactive claude -p call (independent instance)
  claude -p "$PROMPT

## File to Review (path: $FILE):
$(cat "$FILE")" \
    --output-format text 2>/dev/null > "$WORK_DIR/finding_$i.json" || true

  i=$((i + 1))
done

echo ""
echo "Pass 1 complete — $i files reviewed"

# ══════════════════════════════════════════════════════════════════════════════
# PASS 2 — Cross-file architectural review
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "[ PASS 2 ] Cross-file architectural review"
echo "--------------------------------------------------"

CROSS_FILE_INPUT=""
for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    CROSS_FILE_INPUT="${CROSS_FILE_INPUT}
=== FILE: ${FILE} ===
$(cat "$FILE")
"
  fi
done

CROSS_PROMPT="You are a senior architect reviewing a multi-file pull request for cross-cutting issues.

Look for: API contract mismatches, error propagation gaps, inconsistent auth patterns, shared type definitions contradicting actual usage, missing response fields that callers depend on.

DO NOT FLAG per-file local bugs or style issues.

Output ONLY a JSON array (no preamble, no markdown fences). Each element must have: file, line, severity (Critical|Major|Minor), issue, fix. Name the involved files inside the issue text. If no findings, respond with [].

## Pull Request Files:
${CROSS_FILE_INPUT}"

echo "  Running cross-file architectural review ..."

claude -p "$CROSS_PROMPT" \
  --output-format text 2>/dev/null > "$WORK_DIR/finding_cross.json" || true

echo "  Cross-file review complete"

# ══════════════════════════════════════════════════════════════════════════════
# Combine results
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "[ COMBINING ] Merging all findings into report ..."

if command -v jq &>/dev/null; then
  # Merge all JSON arrays from finding files; filter to only valid arrays
  cat "$WORK_DIR"/finding_*.json \
    | jq -s 'map(select(type == "array")) | add // []' \
    > "$REPORT_FILE"

  FINDING_COUNT=$(jq 'length' "$REPORT_FILE")
else
  echo "WARNING: jq not found — concatenating raw output without merging"
  cat "$WORK_DIR"/finding_*.json > "$REPORT_FILE"
  FINDING_COUNT="unknown (install jq for count)"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "=================================================="
echo "  Review complete"
echo "  Findings : $FINDING_COUNT"
echo "  Report   : $REPORT_FILE"
echo "  Schema   : $SCHEMA_FILE"
echo "=================================================="
