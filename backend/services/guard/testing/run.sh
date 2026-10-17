#!/usr/bin/env bash
# Guard: сценарии против живой Laya (:8092) + мини-mock только для Go-логики.
set -euo pipefail

GUARD="$(cd "$(dirname "$0")/.." && pwd)"
cd "$GUARD"

export LAYA_URL="${LAYA_URL:-http://127.0.0.1:8092}"

echo "=== Guard + Laya (live, ${LAYA_URL}) ==="
go test ./internal/laya/ -count=1 -v -run TestEvaluate_Scenarios_Laya

echo ""
echo "=== Guard Go logic (mock Laya answers, 3 cases) ==="
go test ./internal/laya/ -count=1 -v -run TestEvaluate_GuardLogic_Mock

echo ""
echo "=== Prefilter / unit ==="
go test ./internal/laya/ -count=1 -run 'TestPrefilter|TestEvaluate_OffTopic|TestEvaluate_Prefilter'
