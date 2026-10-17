# Whisper (local STT upstream)

Отдельно от `backend/` (Go). Контракт HTTP: `GET /health`, `POST /v1/transcribe` (multipart `audio`).

Позже Go переключится на **облачный STT API** через `STT_UPSTREAM_URL`; эта папка — только локальный dev.

```bash
local-llms/whisper/scripts/setup.sh
./run.sh   # :8091
```
