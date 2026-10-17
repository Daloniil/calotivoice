# CaloriVoice — данные и очереди на AWS

Документ фиксирует **целевую** облачную архитектуру хранения и асинхронной обработки для продакшена. Локальная разработка может временно отличаться (см. §6).

Связанные документы:

- [technical-spec.md](./technical-spec.md) — MVP: дневник, auth, API, офлайн на клиенте
- [backend-microservices.md](./backend-microservices.md) — цепочка STT → Guard → Intake

---

## 1. Решение (итог)

| Компонент | AWS-сервис | Роль |
|-----------|------------|------|
| Регистрация, аккаунт, дневник (источник правды) | **Amazon RDS (PostgreSQL)** | Реляционные данные с транзакциями и отчётами по дням |
| Динамика пайплайна, события, черновики с TTL | **Amazon DynamoDB** | Key-value / document по `check_id`, user-scoped ключи |
| Кэш, rate limit, idempotency | **Amazon ElastiCache (Redis)** | Горячие read-модели, короткоживущие ключи |
| Очереди между микросервисами | **Amazon SQS** | STT → Guard → Intake (dev и prod) |

Дополнительно уже используется или планируется в том же регионе AWS:

- **Amazon SES** — отправка email OTP (см. [email-otp-dev.md](./email-otp-dev.md))
- **Secrets Manager** / **SSM Parameter Store** — строки подключения к RDS, URL очередей SQS

Ориентир по региону: **eu-central-1** (как в `.env.example` для SES).

---

## 2. Amazon RDS (PostgreSQL)

**Единственный источник правды** для данных, которые пользователь ожидает хранить «навсегда» и синхронизировать с приложением.

### 2.1 Что храним

- **users** — id, `created_at`, профиль (timezone, locale и т.п.)
- **auth_identities** — Sign in with Apple, email OTP и другие способы входа
- **refresh_tokens** — hash, rotation, отзыв при logout
- **food_entries** — позиции дневника: user, календарная дата (TZ пользователя), калории/описание, `source`, soft delete, timestamps

Агрегаты календаря («ккал за день») на MVP считаем в SQL; при росте нагрузки — кэш месяца в Redis (см. §4).

### 2.2 Чего избегаем

- Не дублировать те же `food_entries` в DynamoDB как второй master.
- Не хранить сырой аудиопоток на сервере по умолчанию (MVP).

---

## 3. Amazon DynamoDB

**Динамические и pipeline-данные**: высокая скорость записи по ключу, опциональный TTL, не замена RDS для дневника.

### 3.1 Типичные сущности

| Сущность | Пример ключа | Содержимое |
|----------|--------------|------------|
| Статус обработки голоса | `CHECK#<uuid>` или `USER#<id>` + `CHECK#<uuid>` | STT / Guard / Intake: `pending`, `done`, `denied`, JSON результата |
| Idempotency (долгоживущая) | `IDEM#<user_id>#<client_op_id>` | Отметка «операция уже применена» (дублирует или дополняет Redis) |
| Event / audit (опционально) | PK по user или check, SK по времени | Append-only лог для отладки и аналитики |

Рекомендуемый billing на старте: **on-demand**; TTL на черновики pipeline (например 24–72 ч).

### 3.2 Связь с микросервисами

Результаты, которые сегодня держатся **in-memory** в сервисах intake/guard, в prod переносятся в DynamoDB, чтобы переживать рестарты и масштабирование задач.

---

## 4. Redis (ElastiCache)

Redis **не** основное хранилище дневника.

### 4.1 Использование

- Кэш read-модели календаря: `user:{id}:month:{YYYY-MM}` → суммы по дням; инвалидация при изменении записей за затронутые даты
- **Rate limiting** на API (auth, sync)
- **Idempotency-Key** для повторов с мобильного клиента (нестабильная сеть)
- Опционально: session version / blocklist для access JWT

Долговременные данные дневника после успешной записи всегда в **RDS**.

---

## 5. Amazon SQS

Асинхронная связь между Go-сервисами — только **SQS**.

### 5.1 Очереди

| SQS (имя) | Producer → Consumer |
|-----------|---------------------|
| `calorivoice-stt-transcript` | STT → Guard |
| `calorivoice-guard-approved` | Guard → Intake |

Для каждой основной очереди — **dead-letter queue (DLQ)** и redrive policy после N неудачных обработок.

### 5.2 Семантика

- Стандартные очереди SQS: **at-least-once**; обработчики **идемпотентны** по `check_id` / idempotency key.
- Порядок между сообщениями не гарантируется; при необходимости строгого порядка — **FIFO**-очередь для узкого сценария (обычно не требуется для MVP pipeline).

---

## 6. Dev vs prod

| Окружение | БД и кэш | Очереди |
|-----------|----------|---------|
| **Local / Docker** | In-memory store в сервисах; Postgres/Redis — по мере появления API | **SQS** (те же очереди в AWS; ключи в `.env`) |
| **AWS prod** | RDS PostgreSQL, ElastiCache Redis, DynamoDB | **SQS** |

Env: `SQS_STT_TRANSCRIPT_QUEUE_URL`, `SQS_GUARD_APPROVED_QUEUE_URL`, `AWS_REGION`, credentials.

---

## 7. Схема (prod)

```text
[Mobile Expo]
      │ HTTPS
      ▼
[Go API / микросервисы]
      │
      ├──► RDS PostgreSQL     users, auth, food_entries
      ├──► ElastiCache Redis  cache, rate limit, idempotency
      ├──► DynamoDB           pipeline status, TTL drafts
      ├──► SQS                STT → Guard → Intake
      └──► SES                email OTP
```

---

## 8. Принципы

1. **RDS — master** для аккаунта и дневника; клиентский SQLite + outbox синхронизируется с API → Postgres.
2. **DynamoDB + Redis** — динамика, кэш и pipeline; без двух источников правды для одной и той же бизнес-сущности.
3. **SQS в prod** — единый стиль очередей на AWS; идемпотентные workers.
4. Секреты и URL очередей — не в образах контейнеров, а через Secrets Manager / task role (ECS/EKS).

---

*Версия: зафиксировано решение RDS + DynamoDB + Redis + SQS (prod).*
