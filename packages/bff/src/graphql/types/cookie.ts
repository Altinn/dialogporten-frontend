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

  const tryExtract = (s: string) => {
    const match = s.match(/UL=(\d+)/);
    return match?.[1];
  };

  try {
    // Try as-is
    let candidate = encodedValue;
    let ulCode = tryExtract(candidate);
    if (ulCode) return ulToLang[ulCode] as 'nb' | 'nn' | 'en' | undefined;

    // Try decoded once
    candidate = decodeURIComponent(encodedValue);
    ulCode = tryExtract(candidate);
    if (ulCode) return ulToLang[ulCode] as 'nb' | 'nn' | 'en' | undefined;

    // Try decoded twice
    candidate = decodeURIComponent(candidate);
    ulCode = tryExtract(candidate);
    if (ulCode) return ulToLang[ulCode] as 'nb' | 'nn' | 'en' | undefined;

    return undefined;
  } catch {
    return undefined;
  }
};

export const updateAltinnPersistentContextValue = (existingRaw: string | undefined, ulCode: string) => {
  const decoded = existingRaw ?? '';

  if (!decoded) {
    return `UL=${ulCode}`;
  }

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

  return newParts.join('&');
};
