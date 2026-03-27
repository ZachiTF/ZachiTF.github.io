#!/usr/bin/env bash
# Pre-commit hook helper: stamps lastEditedAt in all profile JSON files.
# Usage: bash scripts/stamp-date.sh

set -euo pipefail

echo "Stamping lastEditedAt in profile JSON files..."

DATE=$(date -u +"%Y-%m-%d")
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../data"

for f in "$DATA_DIR"/profile.*.json; do
  if [ -f "$f" ]; then
    # Use a portable sed to replace the lastEditedAt value
    sed -i "s/\"lastEditedAt\": *\"[^\"]*\"/\"lastEditedAt\": \"$DATE\"/" "$f"
    git add "$f" 2>/dev/null || true
  fi
done
