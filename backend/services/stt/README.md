# STT API (Go)

```
Mobile → POST /v1/transcribe (:8080) → Whisper
       → SQS → Guard → SQS → Intake (STT ждёт guard+intake и отдаёт всё в одном JSON)
```

## Dev

Whisper: `local-llms/whisper/run.sh`  
Go: `backend/scripts/docker-up.sh`

## Env

| Variable | Default |
|----------|---------|
| `STT_ADDR` | `0.0.0.0:8080` |
| `STT_UPSTREAM_URL` | `http://host.docker.internal:8091` (Docker) |
| `STT_GUARD_URL` | `http://guard:8082` (Docker) |
| `STT_INTAKE_URL` | `http://intake:8083` (Docker) |
| `STT_PIPELINE_TIMEOUT_SEC` | `180` |

Cloud later: set `STT_UPSTREAM_URL` to provider base URL (same `/health`, `/v1/transcribe` contract if possible).
