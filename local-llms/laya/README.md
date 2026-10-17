# Laya (local guard upstream)

Decision model в [`local-llms/`](../README.md). HTTP: `POST /v1/systemone`.

```bash
local-llms/laya/scripts/setup.sh
./run.sh   # :8092
```

Go guard: `GUARD_UPSTREAM_URL=http://127.0.0.1:8092`

Пакет `laya` на PyPI — только библиотека; сервер — `laya/server.py` (FastAPI).
