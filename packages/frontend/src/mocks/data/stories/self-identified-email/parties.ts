import type { PartyFieldsFragment } from 'bff-types-generated';

export const parties: PartyFieldsFragment[] = [
  {
    party: 'urn:altinn:person:idporten-email:test.testesen@digdir.no',
    partyType: 'SelfIdentified',
    subParties: [],
    name: 'test.testesen@digdir.no',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'ab9608d1-3838-4b42-bfed-0def441b7126',
    hasOnlyAccessToSubParties: false,
    partyId: 1,
  },
  {
    party: 'urn:altinn:person:legacy-selfidentified:testyman',
    partyType: 'SelfIdentified',
    subParties: [],
    name: 'testyman',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: '5b9608d1-3838-4b43-bfed-0def441b7128',
    hasOnlyAccessToSubParties: false,
    partyId: 2,
  },
  {
    party: 'urn:altinn:person:legacy-selfidentified:testyman2',
    partyType: 'SelfIdentified',
    subParties: [],
    name: 'testyman2',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: '5b9608d1-3838-4b43-bfed-0def441ba128',
    hasOnlyAccessToSubParties: false,
    partyId: 3,
  },
];
