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
    document.cookie = `${key}=${value}; Path=/; Domain=${domain}`;
  }
};

export const updatePartyCookies = ({ partyUuid, partyId }: { partyUuid: string; partyId?: number }) => {
  if (partyId && partyUuid) {
    updateCookie('AltinnPartyId', String(partyId));
    updateCookie('AltinnPartyUuid', partyUuid);
  }
};

/**
 * Generic cookie reader, not restricted to PartyCookieName — for one-off
 * preference cookies (e.g. "don't show this modal again") that don't belong
 * in the narrow party-selection cookie union above.
 */
export const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [rawKey, ...rawValParts] = cookie.split('=');
    const key = rawKey.trim();
    if (key === name) {
      return rawValParts.join('=').trim();
    }
  }
  return undefined;
};

/**
 * Generic cookie writer with an explicit expiry (Max-Age, in days) — unlike
 * updateCookie() above (used for party cookies), which writes a session
 * cookie with no expiry. Use this for preferences that must survive across
 * browser sessions (e.g. a permanent "don't show again" dismissal).
 *
 * Deliberately does not set a Domain attribute (unlike updateCookie's party
 * cookies, which need it) — this cookie is only ever read via document.cookie
 * on the same origin it was set on, so it defaults to the exact current host.
 */
export const setCookieWithExpiry = (name: string, value: string, maxAgeDays: number): void => {
  if (typeof document === 'undefined') return;

  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}`;
};
