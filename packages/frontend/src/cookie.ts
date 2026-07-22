import { getCookieDomain } from './auth/url.ts';

export type PartyCookieName = 'AltinnPartyUuid' | 'AltinnPartyId';

export const getPartyFromCookie = (cookieKey: PartyCookieName): string | undefined => {
  if (typeof document === 'undefined') return undefined;

  const cookies = document.cookie.split(';');
  let partyId: string | undefined;

  for (const cookie of cookies) {
    const [rawKey, ...rawValParts] = cookie.split('=');
    const key = rawKey.trim();
    const value = rawValParts.join('=').trim();

    if (key === cookieKey) {
      partyId = value;
      break;
    }
  }

  return partyId;
};

const updateCookie = (key: PartyCookieName, value: string) => {
  const domain = getCookieDomain();
  const existing = getPartyFromCookie(key);
  if (existing !== value) {
    // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is not supported in all target browsers
    document.cookie = `${key}=${value}; Path=/; Domain=${domain}`;
  }
};

export const updatePartyCookies = ({ partyUuid, partyId }: { partyUuid: string; partyId?: number }) => {
  if (partyId && partyUuid) {
    updateCookie('AltinnPartyId', String(partyId));
    updateCookie('AltinnPartyUuid', partyUuid);
  }
};
