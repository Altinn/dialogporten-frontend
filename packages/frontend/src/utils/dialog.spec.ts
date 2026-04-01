import { describe, expect, it } from 'vitest';
import { getServiceOwnerLogo } from './dialog.ts';
import type { OrganizationOutput } from './organizations.ts';

const mkSenderName = (nb: string, en?: string) => [
  { languageCode: 'nb', value: nb },
  ...(en ? [{ languageCode: 'en', value: en }] : []),
];

const withLogo: OrganizationOutput = { name: 'Skatteetaten', logo: 'https://altinncdn.no/orgs/skd/skd.png' };
const withoutLogo: OrganizationOutput = { name: 'Skatteetaten', logo: '' };

describe('getServiceOwnerLogo', () => {
  it('returns logo when senderName is undefined', () => {
    expect(getServiceOwnerLogo(undefined, withLogo)).toBe(withLogo.logo);
  });

  it('returns empty string when senderName is undefined and org has no logo', () => {
    expect(getServiceOwnerLogo(undefined, withoutLogo)).toBe('');
  });

  it('returns logo when senderName matches serviceOwner name in nb', () => {
    expect(getServiceOwnerLogo(mkSenderName('Skatteetaten'), withLogo)).toBe(withLogo.logo);
  });

  it('returns logo when senderName matches with different casing and whitespace', () => {
    expect(getServiceOwnerLogo(mkSenderName('  skatteetaten  '), withLogo)).toBe(withLogo.logo);
  });

  it('returns undefined when senderName differs from serviceOwner name (proxy scenario)', () => {
    expect(getServiceOwnerLogo(mkSenderName('Namsmannen'), withLogo)).toBeUndefined();
  });

  it('compares against serviceOwnerNbName when provided instead of serviceOwner.name', () => {
    const ownerInEnglish: OrganizationOutput = {
      name: 'Tax Administration',
      logo: 'https://altinncdn.no/orgs/skd/skd.png',
    };
    expect(getServiceOwnerLogo(mkSenderName('Skatteetaten'), ownerInEnglish, 'Skatteetaten')).toBe(ownerInEnglish.logo);
  });

  it('returns undefined when senderName differs from serviceOwnerNbName', () => {
    const ownerInEnglish: OrganizationOutput = {
      name: 'Tax Administration',
      logo: 'https://altinncdn.no/orgs/skd/skd.png',
    };
    expect(getServiceOwnerLogo(mkSenderName('Namsmannen'), ownerInEnglish, 'Skatteetaten')).toBeUndefined();
  });

  it('returns undefined when senderName is empty array', () => {
    expect(getServiceOwnerLogo([], withLogo)).toBeUndefined();
  });

  it('returns empty string when both senderName and serviceOwner are undefined', () => {
    expect(getServiceOwnerLogo(undefined, undefined)).toBe('');
  });
});
