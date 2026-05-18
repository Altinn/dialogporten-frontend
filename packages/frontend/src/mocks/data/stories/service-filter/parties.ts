import type { PartyFieldsFragment } from 'bff-types-generated';

const ORG_COUNT = 120;

const generateOrganizationParties = (): PartyFieldsFragment[] =>
  Array.from({ length: ORG_COUNT }, (_, i) => {
    const num = i + 1;
    return {
      party: `urn:altinn:organization:identifier-no:sf-${num}`,
      partyType: 'Organization',
      subParties: [],
      name: `SERVICE FILTER ORG ${num.toString().padStart(3, '0')} AS`,
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: `urn:altinn:organization:uuid:sf-org-${num}`,
      partyId: 1000 + num,
      hasOnlyAccessToSubParties: false,
    };
  });

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
  ...generateOrganizationParties(),
];
