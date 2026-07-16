import { describe, expect, it } from 'vitest';
import { isValidEmail } from './email.ts';

describe('isValidEmail', () => {
  it('accepts a standard email address', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('accepts an email with a subdomain', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('accepts an email with Nordic characters in the domain', () => {
    expect(isValidEmail('user@æøå.no')).toBe(true);
  });

  it('accepts an email with an IP address domain', () => {
    expect(isValidEmail('user@123.45.67.89')).toBe(true);
  });

  it('trims surrounding whitespace before validating', () => {
    expect(isValidEmail('  test@example.com  ')).toBe(true);
  });

  it('rejects an email missing the @ symbol', () => {
    expect(isValidEmail('test.example.com')).toBe(false);
  });

  it('rejects an email with no domain', () => {
    expect(isValidEmail('test@')).toBe(false);
  });

  it('rejects an email with no local part', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects an email with spaces inside', () => {
    expect(isValidEmail('te st@example.com')).toBe(false);
  });
});
