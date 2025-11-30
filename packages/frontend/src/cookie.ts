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
