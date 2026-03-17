export const locales = ["en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type LocalizedString = Record<Locale, string>;

export const localeNames: Record<Locale, string> = {
  en: "English",
};

export const ogLocales: Record<Locale, string> = {
  en: "en_US",
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export async function getDictionary(locale: Locale) {
  return import(`@/i18n/${locale}.json`).then((m) => m.default);
}
