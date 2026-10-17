# Установка CaloriVoice на iPhone (кабель)

Нужен **development build** (не Expo Go): в проекте есть HealthKit и другие нативные модули.

## Иконка и splash

- iOS + общая иконка: `./assets/images/icon.png` (лендинг: `landing/scripts/sync-assets-from-mobile.sh`).
- Splash + PNG: `node scripts/export-brand-mark-png.mjs` из `landing/assets/calorivoice-mark.svg` (= `CaloriVoiceLogo.tsx`).
- Экран входа / splash overlay: тот же mark в `CaloriVoiceLogo.tsx`.
- После смены иконки: `npx expo prebuild --platform ios` или обновить `ios/.../AppIcon.appiconset/`.

## Первый раз: подпись в Xcode

1. iPhone по USB, разблокирован, «Доверять этому компьютеру».
2. Открыть `ios/CaloriVoice.xcworkspace` в Xcode.
3. Target **CaloriVoice** → **Signing & Capabilities** → **Team**: ваш Apple ID (Personal Team) или корпоративная команда, если она добавлена в **Xcode → Settings → Accounts**.
4. Если `com.calorivoice.app` занят — смените **Bundle Identifier** (например `com.yourname.calorivoice`) в Xcode и в `app.json` → `ios.bundleIdentifier`, затем `npx expo prebuild --platform ios`.

## Сборка

**Симулятор — только JS (как раньше, без сборки Xcode):**

```bash
cd mobile
npm run ios
```

Откроется Metro и симулятор (Expo Go). HealthKit / Sign in with Apple в Go не работают — для этого позже `npm run ios:build`.

Другой симулятор: `IOS_SIMULATOR_NAME="iPhone 16 Pro" npm run ios`

**Симулятор — нативный dev build** (подпись / Xcode):

```bash
npm run ios:build
```

**Физический iPhone** — после выбора Team в Xcode:

```bash
npm run ios:device
```

На iPhone: **Настройки → Основные → VPN и управление устройством** → доверить разработчику.

## Metro (JS)

После установки для hot reload:

```bash
cd mobile && npm start
```

Приложение на телефоне подхватит bundler в той же Wi‑Fi сети.
