import { randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

const PERSON_URN = 'urn:altinn:person:identifier-no:20815497741';
const ORG_URN = 'urn:altinn:organization:identifier-no:312159600';
const SI_URN = 'urn:altinn:username:XXXXXX';

const KEY_A = randomBytes(64).toString('base64');
const KEY_B = randomBytes(64).toString('base64');

const importCipher = async (keys: string) => {
  vi.resetModules();
  process.env.PERSON_URN_ENC_KEYS = keys;
  return import('../src/party/personUrnCipher.ts');
};

const importDeep = async (keys: string) => {
  vi.resetModules();
  process.env.PERSON_URN_ENC_KEYS = keys;
  return import('../src/party/transformPersonUrns.ts');
};

const importTransformers = async (keys: string) => {
  vi.resetModules();
  process.env.PERSON_URN_ENC_KEYS = keys;
  return import('../src/party/personUrnTransformers.ts');
};

describe('personUrnCipher', () => {
  const originalKeys = process.env.PERSON_URN_ENC_KEYS;
  afterEach(() => {
    if (originalKeys === undefined) Reflect.deleteProperty(process.env, 'PERSON_URN_ENC_KEYS');
    else process.env.PERSON_URN_ENC_KEYS = originalKeys;
  });

  it('encrypts person URNs with enc: prefix and round-trips them', async () => {
    const { encryptPersonUrn, decryptPersonUrn } = await importCipher(KEY_A);
    const encrypted = encryptPersonUrn(PERSON_URN);
    expect(typeof encrypted).toBe('string');
    expect(encrypted).toMatch(/^urn:altinn:person:identifier-no:enc:/);
    expect(decryptPersonUrn(encrypted)).toBe(PERSON_URN);
  });

  it('is deterministic: same plaintext produces same ciphertext', async () => {
    const { encryptPersonUrn } = await importCipher(KEY_A);
    expect(encryptPersonUrn(PERSON_URN)).toBe(encryptPersonUrn(PERSON_URN));
  });

  it('passes through organization and SI user URNs unchanged', async () => {
    const { encryptPersonUrn, decryptPersonUrn } = await importCipher(KEY_A);
    expect(encryptPersonUrn(ORG_URN)).toBe(ORG_URN);
    expect(encryptPersonUrn(SI_URN)).toBe(SI_URN);
    expect(decryptPersonUrn(ORG_URN)).toBe(ORG_URN);
    expect(decryptPersonUrn(SI_URN)).toBe(SI_URN);
  });

  it('passes through non-string values', async () => {
    const { encryptPersonUrn, decryptPersonUrn } = await importCipher(KEY_A);
    expect(encryptPersonUrn(null)).toBeNull();
    expect(encryptPersonUrn(undefined)).toBeUndefined();
    expect(encryptPersonUrn(42)).toBe(42);
    expect(decryptPersonUrn(null)).toBeNull();
    expect(decryptPersonUrn(42)).toBe(42);
  });

  it('accepts raw person URN as legacy fallback', async () => {
    const { decryptPersonUrn } = await importCipher(KEY_A);
    expect(decryptPersonUrn(PERSON_URN)).toBe(PERSON_URN);
  });

  it('decrypts using a previous key during rotation', async () => {
    const { encryptPersonUrn: encryptOld } = await importCipher(KEY_B);
    const oldCiphertext = encryptOld(PERSON_URN) as string;

    const { decryptPersonUrn } = await importCipher(`${KEY_A},${KEY_B}`);
    expect(decryptPersonUrn(oldCiphertext)).toBe(PERSON_URN);
  });

  it('throws on malformed enc: value that no key can decrypt', async () => {
    const { decryptPersonUrn } = await importCipher(KEY_A);
    expect(() => decryptPersonUrn('urn:altinn:person:identifier-no:enc:not-valid-ciphertext')).toThrow();
  });

  it('rejects keys with invalid length', async () => {
    const shortKey = Buffer.alloc(16).toString('base64');
    await expect(importCipher(shortKey)).rejects.toThrow(/32 or 64/);
  });

  it('rejects empty key configuration', async () => {
    await expect(importCipher('')).rejects.toThrow(/PERSON_URN_ENC_KEYS/);
  });
});

describe('decryptPersonUrnsDeep (inbound variables)', () => {
  it('decrypts encrypted URNs anywhere in nested variables', async () => {
    const { encryptPersonUrn } = await importCipher(KEY_A);
    const encrypted = encryptPersonUrn(PERSON_URN) as string;
    const { decryptPersonUrnsDeep } = await importDeep(KEY_A);
    const decrypted = decryptPersonUrnsDeep({ filter: { party: encrypted, other: ORG_URN } });
    expect(decrypted.filter.party).toBe(PERSON_URN);
    expect(decrypted.filter.other).toBe(ORG_URN);
  });
});

describe('encryptPersonUrnsInResponse (outbound, field-targeted)', () => {
  it('encrypts dialogById.dialog.party regardless of operation name', async () => {
    const { encryptPersonUrnsInResponse } = await importTransformers(KEY_A);
    const response = {
      data: { dialogById: { dialog: { id: 'x', party: PERSON_URN } } },
    };
    const result = encryptPersonUrnsInResponse(undefined, response);
    expect(result.data.dialogById.dialog.party).toMatch(/^urn:altinn:person:identifier-no:enc:/);
  });

  it('encrypts every searchDialogs.items[*].party', async () => {
    const { encryptPersonUrnsInResponse } = await importTransformers(KEY_A);
    const response = {
      data: {
        searchDialogs: {
          items: [
            { id: '1', party: PERSON_URN },
            { id: '2', party: ORG_URN },
            { id: '3', party: PERSON_URN },
          ],
        },
      },
    };
    const result = encryptPersonUrnsInResponse(undefined, response);
    expect(result.data.searchDialogs.items[0].party).toMatch(/^urn:altinn:person:identifier-no:enc:/);
    expect(result.data.searchDialogs.items[1].party).toBe(ORG_URN);
    expect(result.data.searchDialogs.items[2].party).toMatch(/^urn:altinn:person:identifier-no:enc:/);
  });

  it('encrypts parties[*].party', async () => {
    const { encryptPersonUrnsInResponse } = await importTransformers(KEY_A);
    const response = {
      data: {
        parties: [
          { party: PERSON_URN, partyType: 'Person', name: 'A' },
          { party: ORG_URN, partyType: 'Organization', name: 'B' },
        ],
      },
    };
    const result = encryptPersonUrnsInResponse(undefined, response);
    expect(result.data.parties[0].party).toMatch(/^urn:altinn:person:identifier-no:enc:/);
    expect(result.data.parties[1].party).toBe(ORG_URN);
  });

  it('passes through unknown top-level fields untouched', async () => {
    const { encryptPersonUrnsInResponse } = await importTransformers(KEY_A);
    const response = { data: { somethingElse: { party: PERSON_URN } } };
    const result = encryptPersonUrnsInResponse(undefined, response);
    expect(result.data.somethingElse.party).toBe(PERSON_URN);
  });

  it('handles missing data and missing fields gracefully', async () => {
    const { encryptPersonUrnsInResponse } = await importTransformers(KEY_A);
    expect(encryptPersonUrnsInResponse(undefined, { data: {} })).toEqual({ data: {} });
    expect(encryptPersonUrnsInResponse(undefined, null)).toBeNull();
    expect(encryptPersonUrnsInResponse(undefined, { data: { dialogById: { dialog: null } } })).toEqual({
      data: { dialogById: { dialog: null } },
    });
    expect(encryptPersonUrnsInResponse(undefined, { data: { parties: null } })).toEqual({ data: { parties: null } });
  });
});
