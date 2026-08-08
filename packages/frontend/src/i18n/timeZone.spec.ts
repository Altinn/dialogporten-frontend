import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPreferTimeZoneHeader, getTimeZone } from './timeZone.ts';

const mockResolvedTimeZone = (timeZone: unknown) => {
  vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ timeZone }) as Intl.ResolvedDateTimeFormatOptions,
  } as Intl.DateTimeFormat);
};

describe('getTimeZone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return the IANA time zone resolved by the browser', () => {
    mockResolvedTimeZone('America/New_York');
    expect(getTimeZone()).toBe('America/New_York');
  });

  it('should fall back to Europe/Oslo when the runtime resolves no time zone', () => {
    mockResolvedTimeZone(undefined);
    expect(getTimeZone()).toBe('Europe/Oslo');
  });

  it('should fall back to Europe/Oslo for a name that is not a valid IANA time zone', () => {
    mockResolvedTimeZone('Europe/Oslo", injected="value');
    expect(getTimeZone()).toBe('Europe/Oslo');
  });

  it('should fall back to Europe/Oslo when Intl throws', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl unavailable');
    });
    expect(getTimeZone()).toBe('Europe/Oslo');
  });
});

describe('getPreferTimeZoneHeader', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should build an RFC 7240 timezone preference', () => {
    expect(getPreferTimeZoneHeader('Europe/Oslo')).toBe('timezone="Europe/Oslo"');
  });

  it('should use the resolved time zone when none is given', () => {
    mockResolvedTimeZone('Pacific/Auckland');
    expect(getPreferTimeZoneHeader()).toBe('timezone="Pacific/Auckland"');
  });
});
