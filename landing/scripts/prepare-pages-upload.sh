#!/usr/bin/env bash
# Static bundle for Cloudflare Pages (drag-drop or wrangler). No README/scripts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/.pages-build"
ZIP="$ROOT/calorivoice-landing-upload.zip"

rm -rf "$OUT" "$ZIP"
mkdir -p "$OUT"
cp "$ROOT/index.html" "$OUT/"
cp -R "$ROOT/css" "$ROOT/js" "$ROOT/assets" "$OUT/"

(
  cd "$OUT"
  zip -r -X "$ZIP" . -x '*.DS_Store' -x '*/._*'
)

echo "Ready:"
echo "  Folder → $OUT"
echo "  Zip    → $ZIP"
echo ""
echo "Cloudflare: drag the FOLDER .pages-build OR the ZIP (index.html must be at the root inside)."
echo "Wrangler:   npx wrangler pages deploy \"$OUT\" --project-name=YOUR_PROJECT --skip-caching"
