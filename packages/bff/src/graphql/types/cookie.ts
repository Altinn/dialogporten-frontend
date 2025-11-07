export const languageCodes: Record<string, string> = {
  nb: '1044',
  en: '1033',
  nn: '2068',
};

export const ulToLang = Object.entries(languageCodes).reduce<Record<string, string>>((acc, [lang, code]) => {
  acc[code] = lang;
  return acc;
}, {});

export const getLanguageFromAltinnContext = (encodedValue?: string): 'nb' | 'nn' | 'en' | undefined => {
  if (!encodedValue) return undefined;

  try {
    const decoded = decodeURIComponent(encodedValue);
    const match = decoded.match(/UL=(\d+)/);
    if (!match) return undefined;

    const ulCode = match[1];
    return ulToLang[ulCode] as 'nb' | 'nn' | 'en' | undefined;
  } catch {
    return undefined;
  }
};
