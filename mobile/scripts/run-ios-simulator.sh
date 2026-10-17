#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SIM_NAME="${IOS_SIMULATOR_NAME:-iPhone 16 Pro Max}"
BUNDLE_ID="com.calorivoice.app"
BUILD_OUT="$ROOT/build/ios-simulator"

UDID="$(
  xcrun simctl list devices available |
    grep -F "${SIM_NAME} (" |
    head -1 |
    sed -E 's/^[[:space:]]*.*\(([A-F0-9-]{36})\).*/\1/'
)"

if [[ -z "${UDID}" ]]; then
  echo "No available simulator matching \"${SIM_NAME}\"." >&2
  echo "Install runtimes in Xcode → Settings → Platforms." >&2
  exit 1
fi

# Apple Sign In + HealthKit entitlements force code signing when a concrete device
# UDID is passed to `expo run:ios`. Generic simulator build skips that path.
echo "› Building for iOS Simulator (generic destination, no signing prompt)..."
mkdir -p "$BUILD_OUT"
npx expo run:ios --device generic --output "$BUILD_OUT" --no-bundler "$@"

APP_PATH="$BUILD_OUT/CaloriVoice.app"
if [[ ! -d "$APP_PATH" ]]; then
  APP_PATH="$(find "$BUILD_OUT" -maxdepth 1 -name '*.app' -print -quit)"
fi

if [[ -z "${APP_PATH}" || ! -d "${APP_PATH}" ]]; then
  echo "Build finished but .app was not found in ${BUILD_OUT}." >&2
  exit 1
fi

echo "› Simulator: ${SIM_NAME} (${UDID})"
xcrun simctl boot "${UDID}" 2>/dev/null || true
open -a Simulator

echo "› Installing ${APP_PATH}..."
xcrun simctl install "${UDID}" "${APP_PATH}"

echo "› Launching ${BUNDLE_ID}..."
xcrun simctl launch "${UDID}" "${BUNDLE_ID}" >/dev/null || true

echo "› Starting Metro (development build)..."
exec npx expo start --dev-client
