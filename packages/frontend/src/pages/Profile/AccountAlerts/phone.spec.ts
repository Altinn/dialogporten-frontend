import { describe, expect, it } from 'vitest';
import { DEFAULT_COUNTRY_CODE, isValidCountryCodeInput, isValidPhoneNumber, joinPhone, parsePhone } from './phone.ts';

describe('parsePhone', () => {
  it('returns the default country code and empty number for nullish input', () => {
    expect(parsePhone(null)).toEqual({ countryCode: DEFAULT_COUNTRY_CODE, phoneNumber: '' });
    expect(parsePhone(undefined)).toEqual({ countryCode: DEFAULT_COUNTRY_CODE, phoneNumber: '' });
    expect(parsePhone('')).toEqual({ countryCode: DEFAULT_COUNTRY_CODE, phoneNumber: '' });
  });

  it('parses a number with an explicit country code', () => {
    expect(parsePhone('+4791234567')).toEqual({ countryCode: '+47', phoneNumber: '91234567' });
  });

  it('parses a bare national number assuming Norway', () => {
    expect(parsePhone('91234567')).toEqual({ countryCode: '+47', phoneNumber: '91234567' });
  });

  it('falls back to the trimmed digits when the number cannot be parsed', () => {
    expect(parsePhone('+1')).toEqual({ countryCode: DEFAULT_COUNTRY_CODE, phoneNumber: '1' });
  });
});

describe('joinPhone', () => {
  it('joins a country code and phone number into E.164-like format', () => {
    expect(joinPhone('+47', '91234567')).toBe('+4791234567');
  });

  it('adds a leading + when the country code lacks one', () => {
    expect(joinPhone('47', '91234567')).toBe('+4791234567');
  });

  it('strips non-digit characters from the phone number', () => {
    expect(joinPhone('+47', '91 23 45 67')).toBe('+4791234567');
  });

  it('returns an empty string when there are no digits', () => {
    expect(joinPhone('+47', '')).toBe('');
    expect(joinPhone('+47', '   ')).toBe('');
  });
});

describe('isValidPhoneNumber', () => {
  it('validates a correct Norwegian mobile number', () => {
    expect(isValidPhoneNumber('+47', '91234567')).toBe(true);
  });

  it('rejects a number that is too short', () => {
    expect(isValidPhoneNumber('+47', '123')).toBe(false);
  });

  it('rejects an empty number', () => {
    expect(isValidPhoneNumber('+47', '')).toBe(false);
  });

  it('validates a correct foreign number', () => {
    expect(isValidPhoneNumber('+46', '701234567')).toBe(true);
  });
});

describe('isValidCountryCodeInput', () => {
  it('accepts a lone plus sign while typing', () => {
    expect(isValidCountryCodeInput('+')).toBe(true);
  });

  it('accepts a plus followed by up to 3 digits', () => {
    expect(isValidCountryCodeInput('+47')).toBe(true);
    expect(isValidCountryCodeInput('+1')).toBe(true);
  });

  it('rejects input without a leading plus', () => {
    expect(isValidCountryCodeInput('47')).toBe(false);
  });

  it('rejects more than 3 digits', () => {
    expect(isValidCountryCodeInput('+12345')).toBe(false);
  });
});
