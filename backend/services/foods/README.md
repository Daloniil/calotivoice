# Foods

HTTP proxy for product search (Open Food Facts). **Mobile-only** for now — no SQS, no calls from `stt`, `guard`, or `intake`.

- `GET /health`
- `GET /v1/foods/search?q=…&page=1&page_size=10` → `{ items, total, page, page_size, has_more }`

Port **8084** (`FOODS_ADDR`).
