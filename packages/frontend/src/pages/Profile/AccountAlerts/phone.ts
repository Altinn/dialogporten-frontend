import { type CountryCode, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js/mobile';

export const DEFAULT_COUNTRY: CountryCode = 'NO';
export const DEFAULT_COUNTRY_CODE = `+${getCountryCallingCode(DEFAULT_COUNTRY)}`;

export const isValidCountryCodeInput = (input: string): boolean => /^(\+\d{1,3}|\+)$/.test(input);

export const parsePhone = (value: string | null | undefined): { countryCode: string; phoneNumber: string } => {
  if (!value) return { countryCode: DEFAULT_COUNTRY_CODE, phoneNumber: '' };
  const trimmed = value.trim();
  const parsed = trimmed.startsWith('+')
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, DEFAULT_COUNTRY);
  if (parsed) {
    return {
      countryCode: `+${parsed.countryCallingCode}`,
      phoneNumber: parsed.nationalNumber,
    };
  }
  return { countryCode: DEFAULT_COUNTRY_CODE, phoneNumber: trimmed.replace(/^\+/, '') };
};

export const joinPhone = (countryCode: string, phoneNumber: string): string => {
  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) return '';
  const cc = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  return `${cc}${digits}`;
};

export const isValidPhoneNumber = (countryCode: string, phoneNumber: string): boolean => {
  const full = joinPhone(countryCode, phoneNumber);
  if (!full) return false;
  return parsePhoneNumberFromString(full)?.isValid() ?? false;
};
