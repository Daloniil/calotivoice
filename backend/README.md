# Backend (Go)

Микросервисы на Go. Локальные ML-сервисы — [`../local-llms/`](../local-llms/).

| Service | Port | Clients |
|---------|------|---------|
| `stt` | 8080 | mobile (voice) |
| `guard` | 8082 | `stt` |
| `intake` | 8083 | mobile (poll), `stt` via SQS |
| `foods` | 8084 | **mobile only** (product search) |

Запуск: **[RUN.md](../RUN.md)** (корень репо)
