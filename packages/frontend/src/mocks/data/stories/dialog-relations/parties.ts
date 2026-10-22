import type { PartyFieldsFragment, SubPartyFieldsFragment } from 'bff-types-generated';

/**
 * A foretak (main unit) with four bedrifter (subunits). See dialogs.ts.
 *
 * Manual testing:
 *   /inbox/01990000-0000-7000-8000-000000000001/?mock=true&playwrightId=dialog-relations
 *   /?mock=true&playwrightId=dialog-relations&party=urn%3Aaltinn%3Aorganization%3Aidentifier-no%3A910000001
 */
export const MAIN_UNIT_URN = 'urn:altinn:organization:identifier-no:910000001';
export const MAIN_UNIT_NAME = 'BYGG OG ANLEGG AS';

export const subunits = [
  { urn: 'urn:altinn:organization:identifier-no:910000002', name: 'BYGG OG ANLEGG AS AVD NORD' },
  { urn: 'urn:altinn:organization:identifier-no:910000003', name: 'BYGG OG ANLEGG AS AVD SØR' },
  { urn: 'urn:altinn:organization:identifier-no:910000004', name: 'BYGG OG ANLEGG AS AVD ØST' },
  { urn: 'urn:altinn:organization:identifier-no:910000005', name: 'BYGG OG ANLEGG AS AVD VEST' },
];

const subParties: SubPartyFieldsFragment[] = subunits.map((subunit, index) => ({
  party: subunit.urn,
  partyType: 'Organization',
  name: subunit.name,
  isCurrentEndUser: false,
  isDeleted: false,
  partyUuid: `urn:altinn:organization:uuid:avdeling-${index + 1}`,
  partyId: 4001 + index,
  dateOfBirth: null,
}));

export const parties: PartyFieldsFragment[] = [
  {
    party: 'urn:altinn:person:identifier-no:1',
    partyType: 'Person',
    subParties: [],
    name: 'DAGLIG LEDER',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:daglig-leder',
    partyId: 1,
    dateOfBirth: null,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: MAIN_UNIT_URN,
    partyType: 'Organization',
    subParties,
    name: MAIN_UNIT_NAME,
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'urn:altinn:organization:uuid:bygg-og-anlegg',
    partyId: 4000,
    dateOfBirth: null,
    hasOnlyAccessToSubParties: false,
  },
];
