import { aessiv } from '@noble/ciphers/aes.js';
import config from '../config.ts';

const PERSON_URN_PREFIX = 'urn:altinn:person:identifier-no:';
const ENC_MARKER = 'enc:';
const ENCRYPTED_PERSON_URN_PREFIX = `${PERSON_URN_PREFIX}${ENC_MARKER}`;
const PERSON_URN_PATTERN = /^urn:altinn:person:identifier-no:\d+$/;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64Url = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

const fromBase64Url = (value: string): Uint8Array => {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/');
  return new Uint8Array(Buffer.from(padded, 'base64'));
};

const decodeKey = (base64Key: string): Uint8Array => {
  const bytes = new Uint8Array(Buffer.from(base64Key, 'base64'));
  if (bytes.length !== 32 && bytes.length !== 64) {
    throw new Error(`PERSON_URN_ENC_KEYS contains key with ${bytes.length} bytes; expected 32 or 64`);
  }
  return bytes;
};

const keys: Uint8Array[] = config.personUrnEncKeys.map(decodeKey);

if (keys.length === 0) {
  throw new Error('PERSON_URN_ENC_KEYS must contain at least one base64-encoded AES-SIV key (32 or 64 bytes)');
}

export const isPersonUrn = (value: string): boolean => PERSON_URN_PATTERN.test(value);

export const isEncryptedPersonUrn = (value: string): boolean => value.startsWith(ENCRYPTED_PERSON_URN_PREFIX);

export const encryptPersonUrn = (value: unknown): unknown => {
  if (typeof value !== 'string' || !isPersonUrn(value)) {
    return value;
  }
  const suffix = value.slice(PERSON_URN_PREFIX.length);
  const cipher = aessiv(keys[0]);
  const ciphertext = cipher.encrypt(textEncoder.encode(suffix));
  return `${ENCRYPTED_PERSON_URN_PREFIX}${toBase64Url(ciphertext)}`;
};

export const decryptPersonUrn = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  if (value.startsWith(ENCRYPTED_PERSON_URN_PREFIX)) {
    const ciphertext = fromBase64Url(value.slice(ENCRYPTED_PERSON_URN_PREFIX.length));
    let lastError: unknown;
    for (const key of keys) {
      try {
        const plaintext = aessiv(key).decrypt(ciphertext);
        return `${PERSON_URN_PREFIX}${textDecoder.decode(plaintext)}`;
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error('Failed to decrypt person URN with any configured key', { cause: lastError });
  }

  return value;
};
