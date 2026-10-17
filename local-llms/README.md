# Local LLMs (Mac / optional Docker)

Локальные Python-сервисы для пайплайна CaloriVoice. **Не** часть Go `backend/`.

| Папка | Порт | Назначение |
|-------|------|------------|
| [whisper/](./whisper/) | 8091 | STT upstream для Go STT |
| [laya/](./laya/) | 8092 | Guard upstream (system-one) |

Запуск с корня репо:

```bash
local-llms/whisper/run.sh
local-llms/laya/run.sh
```

Intake (Qwen) — **LM Studio** на :1234, не в этой папке. Whisper/Laya — только локально через скрипты выше (не в основном docker-compose).
