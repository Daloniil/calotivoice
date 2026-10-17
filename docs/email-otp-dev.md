# Email OTP (dev, без Go auth)

Пока проверка кода **на телефоне** (in-memory). Отправка письма — **через Metro на Mac** → AWS SES.

Ключи AWS **не** попадают в бандл приложения: они читаются из `.env` в корне репо при `npm run ios`.

## 1. AWS

- SES: verified domain или email, `AUTH_EMAIL_FROM` совпадает (например `noreply@твой-домен.xyz`).
- IAM user: `ses:SendEmail` в том же регионе, что `AWS_REGION`.
- **Sandbox:** получатель тоже должен быть verified **или** запроси production access.

## 2. `.env` в корне репо

```bash
cp .env.example .env
# заполни AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AUTH_EMAIL_FROM
```

## 3. Запуск

```bash
cd mobile && npm run ios
```

Ввод email → Continue → письмо с 6 цифрами → ввод кода → вход как раньше.

Если SES не настроен, в dev остаётся fallback **Dev: 123456**.

## 4. Физический iPhone

Metro должен быть доступен с телефона; OTP идёт на `http://<IP-Mac>:8081/auth/otp/send`. При необходимости:

```bash
EXPO_PUBLIC_OTP_SEND_URL=http://192.168.x.x:8081
```

в `mobile/.env`.

## Дальше

Production: отдельный Go `auth` + Redis, без Metro; мобилка только `POST /auth/otp/*`.
