# LM Studio (Qwen) для Intake

Сервер: **http://127.0.0.1:1234** (OpenAI API: **`/v1`**).

Модель (как в LM Studio): **`qwen/qwen3.8-27b`**

1. Загрузи модель в LM Studio.
2. **Local Server** → порт **1234**.
3. Go Intake: `backend/scripts/docker-up.sh` (в `.env` — `INTAKE_UPSTREAM_URL=http://host.docker.internal:1234/v1`, `INTAKE_MODEL`).

**Qwen 3.8 (reasoning):** Intake шлёт `/no_think`, `enable_thinking: false`, retry с большим `max_tokens`.  
Если в логах LM Studio `content` пустой и весь ответ в `reasoning_content` с `finish_reason: length` — подними `INTAKE_MAX_TOKENS` (4096) или отключи thinking в LM Studio / используй instruct-модель без reasoning.

```env
INTAKE_MAX_TOKENS=2048
```

**Ответ API** `GET /v1/intake/{check_id}` при `status: done`:

```json
{
  "check_id": "...",
  "status": "done",
  "data": {
    "items": [{ "name": "...", "portion": "...", "calories_kcal": 0 }],
    "summary": "...",
    "raw_transcript": "..."
  }
}
```

Проверка:

```bash
curl -s http://127.0.0.1:1234/v1/models
```
