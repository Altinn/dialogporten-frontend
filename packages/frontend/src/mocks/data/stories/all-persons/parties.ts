import type { PartyFieldsFragment } from 'bff-types-generated';

/**
 * A portfolio of persons (the kind an accountant for sole proprietorships represents): the logged-in
 * user plus several other private persons, and no companies. Used to exercise the "Alle personer"
 * group — its visibility threshold, that it includes the end user, and cross-person inbox content.
 */
export const parties: PartyFieldsFragment[] = [
  {
    party: 'urn:altinn:person:identifier-no:1',
    partyType: 'Person',
    subParties: [],
    name: 'TEST TESTESEN',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:test-testesen',
    partyId: 1,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:person:identifier-no:2',
    partyType: 'Person',
    subParties: [],
    name: 'KARI NORDMANN',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:kari-nordmann',
    partyId: 2,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:person:identifier-no:3',
    partyType: 'Person',
    subParties: [],
    name: 'OLA NORDMANN',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:ola-nordmann',
    partyId: 3,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:person:identifier-no:4',
    partyType: 'Person',
    subParties: [],
    name: 'PER HANSEN',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:per-hansen',
    partyId: 4,
    hasOnlyAccessToSubParties: false,
  },
];
