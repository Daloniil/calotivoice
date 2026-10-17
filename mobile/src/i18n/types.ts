export const supportedLocales = ['en', 'ru'] as const;

export type AppLocale = (typeof supportedLocales)[number];
