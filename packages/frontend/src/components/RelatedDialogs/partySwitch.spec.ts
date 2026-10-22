import type { PartyFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { buildPartyGraph } from '../../utils/partyGraph.ts';
import { getPartySwitchTarget, getRelatedDialogHref, getRelatedDialogReturnTo } from './partySwitch.tsx';

const MAIN_UNIT = 'urn:altinn:organization:identifier-no:910000001';
const SUBUNIT = 'urn:altinn:organization:identifier-no:910000002';
const PERSON = 'urn:altinn:person:identifier-no:enc:abc';
const UNKNOWN = 'urn:altinn:organization:identifier-no:999999999';

const party = (urn: string, partyType: string, subParties: PartyFieldsFragment[] = []) =>
  ({
    party: urn,
    partyType,
    partyUuid: urn,
    partyId: 1,
    name: urn,
    isCurrentEndUser: partyType === 'Person',
    isDeleted: false,
    hasOnlyAccessToSubParties: false,
    subParties,
  }) as unknown as PartyFieldsFragment;

/* Subunits are promoted to the top level, as normalizeFlattenParties does for the real party list */
const partyGraph = buildPartyGraph([
  party(PERSON, 'Person'),
  party(MAIN_UNIT, 'Organization', [party(SUBUNIT, 'Organization')]),
  party(SUBUNIT, 'Organization'),
]);

describe('getPartySwitchTarget', () => {
  it('selects an organization (incl. a subunit) through the party param, replacing any other selection', () => {
    const target = getPartySwitchTarget(
      SUBUNIT,
      `?party=${encodeURIComponent(MAIN_UNIT)}&group=ALL_COMPANIES&allParties=true&subAccounts=x&search=foo`,
      partyGraph,
    );

    const params = new URLSearchParams(target.search);
    expect(params.get('party')).toBe(SUBUNIT);
    expect(params.has('group')).toBe(false);
    expect(params.has('allParties')).toBe(false);
    expect(params.has('subAccounts')).toBe(false);
    expect(params.get('search')).toBe('foo');
    expect(target.personParty).toBeUndefined();
  });

  it('keeps persons out of the URL and asks for them to be selected in state', () => {
    const target = getPartySwitchTarget(PERSON, `?party=${encodeURIComponent(MAIN_UNIT)}&mock=true`, partyGraph);

    expect(new URLSearchParams(target.search).has('party')).toBe(false);
    expect(new URLSearchParams(target.search).get('mock')).toBe('true');
    expect(target.personParty).toBe(PERSON);
  });

  it('keeps the current selection when the party is not one of the user’s parties', () => {
    const current = `?party=${encodeURIComponent(MAIN_UNIT)}`;
    const target = getPartySwitchTarget(UNKNOWN, current, partyGraph);

    expect(target.search).toBe(current.slice(1));
    expect(target.personParty).toBeUndefined();
  });
});

describe('getRelatedDialogHref', () => {
  it('omits an empty query string', () => {
    expect(getRelatedDialogHref('abc', '')).toBe('/inbox/abc/');
    expect(getRelatedDialogHref('abc', 'party=x')).toBe('/inbox/abc/?party=x');
  });
});

describe('getRelatedDialogReturnTo', () => {
  it('returns to the current dialog with its party params and location state', () => {
    const search = `?party=${encodeURIComponent(MAIN_UNIT)}`;
    expect(getRelatedDialogReturnTo('/inbox/abc/', search, [MAIN_UNIT], { fromView: '/' })).toEqual({
      href: `/inbox/abc/${search}`,
      personParty: undefined,
      state: { fromView: '/' },
    });
  });

  it('remembers a selected person, as persons are not part of the URL', () => {
    expect(getRelatedDialogReturnTo('/inbox/abc/', '?mock=true', [PERSON]).personParty).toBe(PERSON);
    expect(getRelatedDialogReturnTo('/inbox/abc/', '?group=ALL_PERSONS', [PERSON]).personParty).toBeUndefined();
  });
});
