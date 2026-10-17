import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getStoredLocale, setStoredLocale } from '@/i18n/locale-storage';
import en from '@/i18n/locales/en.json';
import ru from '@/i18n/locales/ru.json';
import { supportedLocales, type AppLocale } from '@/i18n/types';

export { i18n, supportedLocales, type AppLocale };
export { useAppTranslation } from '@/i18n/use-app-translation';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
} as const;

function resolveDeviceLocale(): AppLocale {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return code === 'ru' ? 'ru' : 'en';
}

/** Синхронно поднимаем ресурсы, чтобы t() не отдавал сырые ключи до async init. */
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: resolveDeviceLocale(),
    fallbackLng: 'en',
    supportedLngs: [...supportedLocales],
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
    react: {
      useSuspense: false,
    },
    ...(__DEV__
      ? {
          missingKeyHandler: (_lngs: readonly string[], _ns: string, key: string) => {
            console.warn(`[i18n] missing key: ${key}`);
          },
        }
      : {}),
  });
}

let localePersistenceBound = false;

/** Подтягивает сохранённый язык после SecureStore. */
export async function initI18n(): Promise<typeof i18n> {
  if (!localePersistenceBound) {
    localePersistenceBound = true;
    i18n.on('languageChanged', (language) => {
      if (supportedLocales.includes(language as AppLocale)) {
        void setStoredLocale(language as AppLocale);
      }
    });
  }

  const saved = await getStoredLocale();
  const lng = saved ?? resolveDeviceLocale();
  if (i18n.language !== lng) {
    await i18n.changeLanguage(lng);
  }

  return i18n;
}

export async function setAppLocale(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale);
  await setStoredLocale(locale);
}
