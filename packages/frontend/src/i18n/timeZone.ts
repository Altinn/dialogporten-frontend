const FALLBACK_TIME_ZONE = 'Europe/Oslo';

const validTimeZoneName = /^[A-Za-z0-9_+\-/]+$/;

/**
 * Resolves the end user's IANA time zone name from the browser, e.g. `Europe/Oslo`.
 *
 * Falls back to `Europe/Oslo` when the runtime does not resolve a time zone, or resolves one
 * containing characters that are not valid in an IANA name.
 */
export const getTimeZone = (): string => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone && validTimeZoneName.test(timeZone) ? timeZone : FALLBACK_TIME_ZONE;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
};

/**
 * Builds an RFC 7240 `Prefer` header value telling the service owner which time zone dates and
 * times in the response should be formatted for, e.g. `timezone="Europe/Oslo"`.
 */
export const getPreferTimeZoneHeader = (timeZone: string = getTimeZone()): string => `timezone="${timeZone}"`;
