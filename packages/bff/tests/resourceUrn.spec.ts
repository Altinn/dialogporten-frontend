import { describe, expect, it } from 'vitest';
import { isNotifiableResourceIdentifier, isValidResourceUrn } from '../src/graphql/shared/resourceUrn.ts';

describe('isValidResourceUrn', () => {
  it('accepts URNs built from lowercase letters, digits, underscore and hyphen', () => {
    expect(isValidResourceUrn('urn:altinn:resource:app_skd_a2-213-2638')).toBe(true);
    expect(isValidResourceUrn('urn:altinn:resource:ske-krav-og-betalinger')).toBe(true);
    expect(isValidResourceUrn('urn:altinn:resource:abcd')).toBe(true);
  });

  it('rejects Altinn 1 identifiers carrying a version suffix', () => {
    expect(isValidResourceUrn('urn:altinn:resource:app_skd_a1-213-2638:1')).toBe(false);
    expect(isValidResourceUrn('urn:altinn:resource:app_ssb_a1-857-2496:1')).toBe(false);
  });

  it('rejects identifiers shorter than four characters', () => {
    expect(isValidResourceUrn('urn:altinn:resource:abc')).toBe(false);
    expect(isValidResourceUrn('urn:altinn:resource:')).toBe(false);
  });

  it('rejects uppercase, whitespace and a missing prefix', () => {
    expect(isValidResourceUrn('urn:altinn:resource:App_Skd_Test')).toBe(false);
    expect(isValidResourceUrn('urn:altinn:resource:app skd test')).toBe(false);
    expect(isValidResourceUrn(' urn:altinn:resource:ske-krav-og-betalinger')).toBe(false);
    expect(isValidResourceUrn('ske-krav-og-betalinger')).toBe(false);
  });
});

describe('isNotifiableResourceIdentifier', () => {
  it('validates a bare resource registry identifier', () => {
    expect(isNotifiableResourceIdentifier('app_skd_a2-213-2638')).toBe(true);
    expect(isNotifiableResourceIdentifier('ske-krav-og-betalinger')).toBe(true);
  });

  it('rejects Altinn 1 identifiers carrying a version suffix', () => {
    expect(isNotifiableResourceIdentifier('app_skd_a1-213-2638:1')).toBe(false);
  });

  it('rejects empty and whitespace-only identifiers', () => {
    expect(isNotifiableResourceIdentifier('')).toBe(false);
    expect(isNotifiableResourceIdentifier('   ')).toBe(false);
  });
});
