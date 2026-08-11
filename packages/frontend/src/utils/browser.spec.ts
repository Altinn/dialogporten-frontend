import { describe, expect, it } from 'vitest';
import { isFirefoxOnIOS } from './browser.ts';

const FIREFOX_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/135.0 Mobile/15E148 Safari/605.1.15';
const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1';
const CHROME_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/132.0.6834.98 Mobile/15E148 Safari/604.1';
const FIREFOX_ANDROID = 'Mozilla/5.0 (Android 15; Mobile; rv:135.0) Gecko/135.0 Firefox/135.0';
const FIREFOX_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:135.0) Gecko/20100101 Firefox/135.0';

describe('isFirefoxOnIOS', () => {
  it('detects Firefox for iOS', () => {
    expect(isFirefoxOnIOS(FIREFOX_IOS)).toBe(true);
  });

  it.each([
    ['Safari on iOS', SAFARI_IOS],
    ['Chrome on iOS', CHROME_IOS],
    ['Firefox on Android', FIREFOX_ANDROID],
    ['Firefox on desktop', FIREFOX_DESKTOP],
  ])('returns false for %s', (_label, userAgent) => {
    expect(isFirefoxOnIOS(userAgent)).toBe(false);
  });

  it('returns false for an empty user agent', () => {
    expect(isFirefoxOnIOS('')).toBe(false);
  });
});
