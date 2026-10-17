# RUN

Один раз: `cp .env.example .env` и заполни AWS/SQS.

Из корня репозитория, отдельные терминалы:

**Whisper (STT, :8091)**

```bash
local-llms/whisper/run.sh
```

**Laya (Guard, :8092)**

```bash
local-llms/laya/run.sh
```

**LM Studio (Intake, :1234)** — Local Server, модель из `INTAKE_MODEL` в `.env`.

**Docker backend (STT :8080, Guard :8082, Intake :8083, Foods :8084)**

```bash
backend/scripts/docker-up.sh
```

**Mobile**

```bash
cd mobile && npm run ios
```

Остановить Docker Go: `docker compose stop stt guard intake foods`
