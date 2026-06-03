import type { PartyFieldsFragment, SubPartyFieldsFragment } from 'bff-types-generated';

/**
 * A single parent organization ("STORSELSKAP AS") that has more than
 * MAX_DIALOG_PARTY_SIZE (100) sub-units. Selecting the parent expands
 * (via getPartyIds) into parent + all sub-units, exceeding the 100-party
 * query limit. Used to verify the inbox clears the previously selected
 * view's dialogs instead of leaving them hanging.
 */
const SUBUNIT_COUNT = 120;

const pad = (n: number) => n.toString().padStart(3, '0');

const generateSubUnits = (): SubPartyFieldsFragment[] =>
  Array.from({ length: SUBUNIT_COUNT }, (_, i) => {
    const num = i + 1;
    return {
      party: `urn:altinn:organization:identifier-sub:${num}`,
      partyType: 'Organization',
      name: `STORSELSKAP AVD ${pad(num)}`,
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: `urn:altinn:organization:uuid:storselskap-sub-${pad(num)}`,
      partyId: 2000 + num,
    };
  });

export const parties: PartyFieldsFragment[] = [
  {
    party: 'urn:altinn:person:identifier-no:1',
    partyType: 'Person',
    subParties: [],
    name: 'STORTEST PERSON',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:stortest-person',
    partyId: 1,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:organization:identifier-no:1',
    partyType: 'Organization',
    subParties: generateSubUnits(),
    name: 'STORSELSKAP AS',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'urn:altinn:organization:uuid:storselskap-as',
    partyId: 1000,
    hasOnlyAccessToSubParties: false,
  },
];
