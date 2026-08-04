const supportedLanguages = ['nb', 'nn', 'en'] as const;

type SupportedLanguage = (typeof supportedLanguages)[number];

const preferredMapping: Record<SupportedLanguage, SupportedLanguage[]> = {
  nb: ['nb', 'nn', 'en'],
  nn: ['nn', 'nb', 'en'],
  en: ['en', 'nb', 'nn'],
};

const isSupportedLanguage = (language: string): language is SupportedLanguage =>
  supportedLanguages.includes(language as SupportedLanguage);

/**
 * Builds an `Accept-Language` header value for the given language, ordering the remaining
 * supported languages after it with descending q values, e.g. `en, nb;q=0.9, nn;q=0.8`.
 *
 * Mirrors `getSupportedLanguage` / `toAcceptLanguageHeader` in the BFF so service owners see the
 * same preference order from both. Unsupported input falls back to the `nb` ordering, matching
 * `getPreferredPropertyByLocale`.
 */
export const getAcceptLanguageHeader = (language: string): string => {
  const primary = language.split('-')[0];
  const langs = preferredMapping[isSupportedLanguage(primary) ? primary : 'nb'];

  return langs.map((lang, index) => (index === 0 ? lang : `${lang};q=${(1 - index * 0.1).toFixed(1)}`)).join(', ');
};
