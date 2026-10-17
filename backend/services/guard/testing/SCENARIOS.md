# Guard — сценарии

**Данные:** `scenarios.json`  
**Генерация:** `cd backend/services/guard && go run ./testing/gen_scenarios.go`

| Группа | Ожидание |
|--------|----------|
| `allow_*` | Laya + Guard → `allowed: true` |
| `block_*` | Laya + Guard → `allowed: false` |
| `guardmock_*` | только mock (ошибочный ответ Laya → проверка порогов Go) |

```bash
# Laya должна быть запущена: local-llms/laya/run.sh
backend/services/guard/testing/run.sh
```

Без Laya (CI): `GUARD_SKIP_LAYA=1 go test ./internal/laya/ -run TestEvaluate_GuardLogic_Mock`
