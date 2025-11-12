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

export const updateAltinnPersistentContextValue = (existingRaw: string | undefined, ulCode: string) => {
  const decoded = existingRaw ? decodeURIComponent(existingRaw) : '';
  if (!decoded) return encodeURIComponent(`UL=${ulCode}`);

  const parts = decoded.split('&').filter(Boolean);
  let replaced = false;

  const newParts = parts.map((p) => {
    if (p.startsWith('UL=')) {
      replaced = true;
      return `UL=${ulCode}`;
    }
    return p;
  });

  if (!replaced) newParts.push(`UL=${ulCode}`);
  return encodeURIComponent(newParts.join('&'));
};
