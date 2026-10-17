import * as SecureStore from 'expo-secure-store';

import type { AppLocale } from '@/i18n/types';

const LOCALE_KEY = 'calorivoice_locale';

export async function getStoredLocale(): Promise<AppLocale | null> {
  const raw = await SecureStore.getItemAsync(LOCALE_KEY);
  if (raw === 'en' || raw === 'ru') return raw;
  return null;
}

export async function setStoredLocale(locale: AppLocale): Promise<void> {
  await SecureStore.setItemAsync(LOCALE_KEY, locale);
}
