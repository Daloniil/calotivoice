#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SIM_NAME="${IOS_SIMULATOR_NAME:-iPhone 16 Pro Max}"

UDID="$(
  xcrun simctl list devices available |
    grep -F "${SIM_NAME} (" |
    head -1 |
    sed -E 's/^[[:space:]]*.*\(([A-F0-9-]{36})\).*/\1/'
)"

if [[ -n "${UDID}" ]]; then
  echo "› Simulator: ${SIM_NAME} (${UDID})"
  xcrun simctl boot "${UDID}" 2>/dev/null || true
  open -a Simulator
else
  echo "› No simulator named \"${SIM_NAME}\"; Expo will pick a default." >&2
fi

echo "› Expo Go + Metro (STT via :8081/stt → Go :8080). Backend: backend/scripts/docker-up.sh"
exec npx expo start --ios --go "$@"
