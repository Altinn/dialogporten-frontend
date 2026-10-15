import { describe, expect, it } from 'vitest';
import { getInvalidRecipients, parseRecipients } from './recipients.ts';

describe('parseRecipients', () => {
  it('returns a single address', () => {
    expect(parseRecipients('kari@example.com')).toEqual(['kari@example.com']);
  });

  it('splits on semicolons and commas and trims whitespace', () => {
    expect(parseRecipients(' kari@example.com;ola@example.com , per@example.com ')).toEqual([
      'kari@example.com',
      'ola@example.com',
      'per@example.com',
    ]);
  });

  it('ignores empty entries', () => {
    expect(parseRecipients(';kari@example.com;; ;ola@example.com;')).toEqual(['kari@example.com', 'ola@example.com']);
  });

  it('keeps the first of addresses that only differ in case', () => {
    expect(parseRecipients('Kari@Example.com; kari@example.com')).toEqual(['Kari@Example.com']);
  });

  it.each(['', '   ', ';', ' ; , '])('returns no recipients for %j', (input) => {
    expect(parseRecipients(input)).toEqual([]);
  });
});

describe('getInvalidRecipients', () => {
  it('returns the addresses that are not valid emails', () => {
    expect(getInvalidRecipients(['kari@example.com', 'ola@example', 'per'])).toEqual(['ola@example', 'per']);
  });

  it('returns nothing when all addresses are valid', () => {
    expect(getInvalidRecipients(['kari@example.com', 'ola@example.no'])).toEqual([]);
  });
});
