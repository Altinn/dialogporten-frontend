import type { PartyFieldsFragment } from 'bff-types-generated';

export const parties: PartyFieldsFragment[] = [
  {
    party: 'urn:altinn:username:selfidentified',
    partyType: 'SelfIdentified',
    subParties: [],
    name: 'SELFTEST OIDC',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:test-testesen',
    hasOnlyAccessToSubParties: false,
  },
];

