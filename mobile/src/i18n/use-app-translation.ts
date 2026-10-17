import { useTranslation } from 'react-i18next';

/** Переводы для RN: без Suspense, namespace `translation`. */
export function useAppTranslation() {
  return useTranslation('translation', { useSuspense: false });
}
