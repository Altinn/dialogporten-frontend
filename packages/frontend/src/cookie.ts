export type PartyCookieName = 'AltinnPartyUuid' | 'AltinnPartyId';
export type AltinnCookieName = PartyCookieName | 'altinnPersistentContext';

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

/**
 * Clears a cookie from the production domain (.altinn.no)
 * This is needed in test environments (TT02) to prevent production cookies from interfering.
 *
 * Problem: When browsers connect to tt02.altinn.no, they send cookies from BOTH:
 * - .altinn.no (production domain)
 * - .tt02.altinn.no (test domain)
 *
 * The production domain cookie (.altinn.no) matches tt02.altinn.no hosts because
 * .altinn.no is more generic. Browsers and servers often read the production cookie first,
 * causing test environment to use production values even after attempting changes in TT02.
 *
 * This function explicitly deletes the production cookie to ensure TT02 cookies take precedence.
 */
export const clearProductionCookie = (cookieKey: AltinnCookieName): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${cookieKey}=; Path=/; Domain=.altinn.no; Max-Age=0`;
};
