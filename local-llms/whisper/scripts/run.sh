#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv"

if [[ ! -d "$VENV" ]]; then
  echo "Whisper venv не найден — запускаю setup…" >&2
  bash "$ROOT/scripts/setup.sh"
fi

export WHISPER_MODEL="${WHISPER_MODEL:-small}"
export WHISPER_DEVICE="${WHISPER_DEVICE:-cpu}"
export WHISPER_COMPUTE_TYPE="${WHISPER_COMPUTE_TYPE:-int8}"
export PORT="${WHISPER_PORT:-8091}"
export WHISPER_BIND="${WHISPER_BIND:-127.0.0.1}"

HEALTH_URL="http://${WHISPER_BIND}:${PORT}/health"

if curl -sf "$HEALTH_URL" 2>/dev/null | grep -q '"status":"ok"'; then
  echo "Whisper already running: ${HEALTH_URL}"
  exit 0
fi

if lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${PORT} busy but /health failed. Освободи порт (lsof/kill) или смени WHISPER_PORT." >&2
  exit 1
fi

PY="$VENV/bin/python"
if [[ ! -x "$PY" ]]; then
  echo "Нет $PY — запускаю setup…" >&2
  bash "$ROOT/scripts/setup.sh"
  PY="$VENV/bin/python"
fi

echo "Whisper on ${WHISPER_BIND}:${PORT} (model=${WHISPER_MODEL})"
exec "$PY" "$ROOT/server.py"
