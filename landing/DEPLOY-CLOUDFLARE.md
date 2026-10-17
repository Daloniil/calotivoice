# Деплой landing на Cloudflare Pages

## Если в dash.cloudflare.com: «Refresh the page to try again»

Это **баг/сбой UI Cloudflare**, не твой домен и не landing. Часто ломает **Support Chat** в углу (ошибка в консоли про `reading 'color'`, запрос `support-chat/conversations`).

**Попробуй по порядку:**

1. **Incognito / другой браузер** (Chrome), выключи adblock на `dash.cloudflare.com`.
2. **Зайди с телефона** (Safari/Chrome) — иногда дашборд там открывается, когда на Mac нет.
3. **Обход чата (Chrome):** DevTools → Sources → **Overrides** → включить → перезагрузить → Network → запрос `support-chat/conversations` → Save for overrides → в JSON заменить `"sender":"tool"` на `"sender":"ai"` → reload.
4. Делай нужное **через CLI**, пока UI мёртв:
   ```bash
   npx wrangler login
   npx wrangler pages project list
   npx wrangler pages deploy landing/.pages-build --project-name=ИМЯ --skip-caching
   ```
5. Если не помогло — [Cloudflare Support](https://developers.cloudflare.com/support/contacting-cloudflare-support/) или статус: https://www.cloudflarestatus.com/

---

Сайт — **статика** (~130 KB, 7 файлов). Ошибка **«Failed to upload / Try again»** при заливке — отдельно: способ загрузки или API Cloudflare.

## 1. Собери правильную папку

```bash
bash landing/scripts/prepare-pages-upload.sh
```

Загружай **`landing/.pages-build`** или **`landing/calorivoice-landing-upload.zip`** — не весь репозиторий `calorivoice` и не папку с `scripts/` и `README.md`.

В корне загрузки обязательно:

- `index.html`
- `css/`, `js/`, `assets/`

## 2. Тип проекта в Cloudflare

| Как создал проект | Drag & drop в браузере |
|-------------------|-------------------------|
| **Direct Upload** | ✅ работает |
| **Подключён Git** (GitHub) | ❌ drag & drop **не поддерживается** — только деплой из Git или `wrangler pages deploy` |

Если проект когда‑то привязали к Git — либо пуш в репо, либо новый проект **Create → Direct Upload**.

## 3. Если снова «Try again» (APIError / 524)

Это частый **таймаут на стороне Cloudflare**, не твои файлы.

1. Подожди 5–10 минут и повтори.
2. Другой браузер (Chrome) или **Wrangler** (надёжнее UI):

```bash
bash landing/scripts/prepare-pages-upload.sh
npx wrangler login
npx wrangler pages deploy landing/.pages-build --project-name=ИМЯ_ПРОЕКТА --skip-caching
```

`ИМЯ_ПРОЕКТА` — как в дашборде (например `calorivoice`).

3. [Cloudflare Status](https://www.cloudflarestatus.com/) — сбои Pages/KV.

## 4. Домен calorivoice.uk

После успешного деплоя: **Pages → проект → Custom domains → Add** `calorivoice.uk` / `www`. DNS уже в Cloudflare — обычно одна кнопка.

## 5. Проверка локально

```bash
cd landing/.pages-build && python3 -m http.server 8787
```

Открой http://127.0.0.1:8787 — если тут ок, на Pages тоже должно быть ок после успешного upload.
