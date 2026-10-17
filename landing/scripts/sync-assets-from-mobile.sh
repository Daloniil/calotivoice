#!/usr/bin/env bash
# Единый источник: mobile/assets/images/ (см. mobile/app.json → icon, favicon, splash)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/mobile/assets/images"
DST="$ROOT/landing/assets"
mkdir -p "$DST"
cp "$SRC/icon.png" "$DST/icon.png"
cp "$SRC/favicon.png" "$DST/favicon.png"
cp "$SRC/splash-icon.png" "$DST/splash-icon.png"
cp "$ROOT/landing/assets/calorivoice-mark.svg" "$DST/calorivoice-mark.svg" 2>/dev/null || true
echo "Synced brand assets → landing/assets/ (PNG from mobile/scripts/export-brand-mark-png.mjs)"
