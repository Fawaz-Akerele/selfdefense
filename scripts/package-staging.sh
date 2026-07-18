#!/bin/bash
# Creates sydef-staging-package.zip for AWS handoff (excludes node_modules, .next, .git)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${ROOT}/../sydef-staging-package.zip"
cd "$ROOT/.."
rm -f "$OUT"
zip -r "$OUT" sydef \
  -x "sydef/node_modules/*" \
  -x "sydef/.next/*" \
  -x "sydef/.git/*" \
  -x "sydef/*.tsbuildinfo" \
  -x "sydef/.env.local" \
  -x "sydef/.env"
echo "Created: $OUT"
ls -lh "$OUT"
