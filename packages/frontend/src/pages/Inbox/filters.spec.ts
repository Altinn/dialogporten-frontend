import type { CountableDialogFieldsFragment, OrganizationFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { FilterCategory, getFilters, getServiceOwnerSearchWords } from './filters.tsx';

const makeOrg = (id: string, name: string): OrganizationFieldsFragment => ({
  id,
  logo: null,
  orgnr: null,
  homepage: null,
  environments: [],
  name: { nb: name, nn: name, en: name },
  contact: null,
});

const organizations = [makeOrg('ssb', 'Statistisk sentralbyrå'), makeOrg('nav', 'Arbeids- og velferdsetaten (NAV)')];

const matchesQuery = (searchWords: string[], query: string): boolean =>
  searchWords.some((word) => word.toLowerCase().includes(query.trim().toLowerCase()));

describe('getServiceOwnerSearchWords', () => {
  it('includes the org code alongside the localized name', () => {
    expect(getServiceOwnerSearchWords(organizations[0], 'Statistisk sentralbyrå')).toEqual([
      'Statistisk sentralbyrå',
      'ssb',
    ]);
  });

  it('deduplicates when the name falls back to the org code', () => {
    expect(getServiceOwnerSearchWords(organizations[0], 'ssb')).toEqual(['ssb']);
  });

  it('skips empty values', () => {
    expect(getServiceOwnerSearchWords(makeOrg('', ''), '')).toEqual([]);
  });
});

describe('service owner filter search', () => {
  const getOrgItems = () => {
    const filters = getFilters({
      allDialogs: [] as CountableDialogFieldsFragment[],
      allOrganizations: organizations,
      viewType: 'inbox',
    });
    return filters.find((filter) => filter.name === FilterCategory.ORG)?.items ?? [];
  };

  it('matches on org code when the name does not contain the query', () => {
    const ssb = getOrgItems().find((item) => item.value === 'ssb');
    expect(ssb?.title).toBe('Statistisk sentralbyrå');
    expect(matchesQuery(ssb?.searchWords ?? [], 'SSB')).toBe(true);
  });

  it('still matches on the service owner name', () => {
    const nav = getOrgItems().find((item) => item.value === 'nav');
    expect(matchesQuery(nav?.searchWords ?? [], 'velferd')).toBe(true);
  });
});
