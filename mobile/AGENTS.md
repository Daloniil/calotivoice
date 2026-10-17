This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npm run ios                 # Metro + iOS Simulator (Expo Go / existing dev client, no Xcode build)
npm run ios:build           # compile native dev client, install on simulator, then Metro
npm run ios:device          # physical iPhone (requires Xcode signing)
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Internationalization (i18n)

- **Libraries:** `i18next`, `react-i18next`, `expo-localization`.
- **Init:** `initI18n()` in `src/app/_layout.tsx` before auth; app wrapped in `I18nextProvider`.
- **Locales:** `src/i18n/locales/en.json`, `ru.json` — add keys to both when introducing user-facing copy.
- **Usage:** `useTranslation()` in components; `i18n.t()` in non-React modules (e.g. `auth-api`, `apple-health`).
- **Persistence:** user choice in Secure Store (`src/i18n/locale-storage.ts`); default from device language (`ru` vs `en`).
- **Switcher:** `AppLanguageChrome` in `src/app/_layout.tsx` (top-right on every stack screen). Reserve space with `useAppLanguageTopInset()` so content does not sit under EN/RU. Call `setAppLocale()` from `@/i18n` for programmatic changes.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Source layout

```
src/
  app/                 # Expo Router: thin route files only (re-export screens when useful)
  features/            # Product areas
    auth/components/
    onboarding/components/
    home/screens/
  shared/              # Cross-feature UI and design tokens
    components/brand|i18n|ui/
    constants/
    hooks/
    styles/
  contexts/            # React providers (auth, profile)
  lib/                 # API, storage, domain helpers (auth, profile, health)
  i18n/
assets/
  images/              # CaloriVoice mark PNGs — node scripts/export-brand-mark-png.mjs
```

- New UI for a flow → `features/<name>/components/` or `features/<name>/screens/`.
- Shared tokens → `shared/constants/` (`theme`, `auth-screen-theme`, `navigation-theme`).
- Do not reintroduce unused Expo template screens (tabs/explore, animated-icon demo assets).

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
