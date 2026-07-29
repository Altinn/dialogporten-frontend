import { describe, expect, it } from 'vitest';
import { getAcceptLanguageHeader } from './acceptLanguage.ts';

describe('getAcceptLanguageHeader', () => {
  it('should put the selected language first and weight the fallbacks', () => {
    expect(getAcceptLanguageHeader('nb')).toBe('nb, nn;q=0.9, en;q=0.8');
    expect(getAcceptLanguageHeader('nn')).toBe('nn, nb;q=0.9, en;q=0.8');
    expect(getAcceptLanguageHeader('en')).toBe('en, nb;q=0.9, nn;q=0.8');
  });

  it('should ignore a region subtag', () => {
    expect(getAcceptLanguageHeader('en-US')).toBe('en, nb;q=0.9, nn;q=0.8');
    expect(getAcceptLanguageHeader('nb-NO')).toBe('nb, nn;q=0.9, en;q=0.8');
  });

  it('should fall back to the nb ordering for unsupported languages', () => {
    expect(getAcceptLanguageHeader('de')).toBe('nb, nn;q=0.9, en;q=0.8');
    expect(getAcceptLanguageHeader('')).toBe('nb, nn;q=0.9, en;q=0.8');
  });

  it('should only use characters allowed for a CORS-safelisted header value', () => {
    for (const language of ['nb', 'nn', 'en']) {
      const value = getAcceptLanguageHeader(language);
      expect(value).toMatch(/^[0-9A-Za-z *,\-.;=]+$/);
      expect(value.length).toBeLessThanOrEqual(128);
    }
  });
});
