#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv"

if [[ ! -d "$VENV" ]]; then
  echo "Laya venv не найден — запускаю setup…" >&2
  bash "$ROOT/scripts/setup.sh"
fi

PY="$VENV/bin/python"
if [[ ! -x "$PY" ]]; then
  echo "Нет $PY — запускаю setup…" >&2
  bash "$ROOT/scripts/setup.sh"
  PY="$VENV/bin/python"
fi

export LAYA_HOST="${LAYA_HOST:-127.0.0.1}"
export LAYA_PORT="${LAYA_PORT:-8092}"
export LAYA_SUBFOLDER="${LAYA_SUBFOLDER:-${LAYA_MODELS:-multilingual}}"

if curl -sf "http://${LAYA_HOST}:${LAYA_PORT}/health" >/dev/null 2>&1; then
  echo "Laya already running on ${LAYA_HOST}:${LAYA_PORT}"
  exit 0
fi

echo "Laya on ${LAYA_HOST}:${LAYA_PORT} subfolder=${LAYA_SUBFOLDER} (first start downloads weights)"
exec "$PY" "$ROOT/server.py"
