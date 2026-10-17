#!/usr/bin/env bash
# Go (stt, guard, intake) в Docker + SQS. Whisper/Laya/Qwen — локально на Mac.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

if [[ -f .env ]]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

if [[ -z "${SQS_STT_TRANSCRIPT_QUEUE_URL:-}" || -z "${SQS_GUARD_APPROVED_QUEUE_URL:-}" ]]; then
  echo "Заполни SQS_STT_TRANSCRIPT_QUEUE_URL и SQS_GUARD_APPROVED_QUEUE_URL в .env" >&2
  exit 1
fi

export DOCKER_BUILDKIT="${DOCKER_BUILDKIT:-1}"
export COMPOSE_DOCKER_CLI_BUILD="${COMPOSE_DOCKER_CLI_BUILD:-1}"
export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-4}"

warn_local() {
  local url=$1
  local name=$2
  if ! curl -sf "$url" >/dev/null 2>&1; then
    echo "⚠  ${name} не отвечает на ${url} — запусти локально до записи голоса." >&2
  fi
}

BUILD=1
if [[ "${1:-}" == "--no-build" ]]; then
  BUILD=0
  shift
fi

if [[ "$BUILD" == "1" ]]; then
  echo "Building Go services (parallel)…"
  docker compose build --parallel "$@"
fi

echo "Starting stt + guard + intake + foods…"
docker compose up -d "$@"

echo ""
warn_local "http://127.0.0.1:8091/health" "Whisper"
warn_local "http://127.0.0.1:8092/health" "Laya"
warn_local "http://127.0.0.1:1234/v1/models" "LM Studio (Qwen)"

