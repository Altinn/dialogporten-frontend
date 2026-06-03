import type { PartyFieldsFragment } from 'bff-types-generated';

/**
 * A current end user (person) plus more than MAX_DIALOG_PARTY_SIZE (100)
 * top-level organizations. Selecting "Alle virksomheter" expands into all
 * org parties, exceeding the 100-party query limit. Used to verify the
 * inbox clears the previously selected view's dialogs instead of leaving
 * them hanging.
 */
const ORG_COUNT = 120;

const pad = (n: number) => n.toString().padStart(3, '0');

const generateOrganizations = (): PartyFieldsFragment[] =>
  Array.from({ length: ORG_COUNT }, (_, i) => {
    const num = i + 1;
    return {
      party: `urn:altinn:organization:identifier-no:${num}`,
      partyType: 'Organization',
      subParties: [],
      name: `STORVIRKSOMHET ${pad(num)} AS`,
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: `urn:altinn:organization:uuid:storvirksomhet-${pad(num)}`,
      partyId: 1000 + num,
      hasOnlyAccessToSubParties: false,
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
  ...generateOrganizations(),
];
