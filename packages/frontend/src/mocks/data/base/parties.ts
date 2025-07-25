import type { PartyFieldsFragment } from 'bff-types-generated';

export const parties: PartyFieldsFragment[] = [
  {
    party: 'urn:altinn:person:identifier-no:1',
    partyType: 'Person',
    subParties: [],
    isAccessManager: true,
    isMainAdministrator: false,
    name: 'TEST TESTESEN',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:identifier-no:1337',
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:organization:identifier-no:1',
    partyType: 'Organization',
    subParties: [],
    isAccessManager: true,
    isMainAdministrator: false,
    name: 'Firma AS',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:identifier-no:1337',
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:organization:identifier-no:2',
    partyType: 'Organization',
    subParties: [
      {
        party: 'urn:altinn:organization:identifier-sub:1',
        partyType: 'Organization',
        isAccessManager: true,
        isMainAdministrator: true,
        name: 'TESTBEDRIFT AS AVD SUB',
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:person:identifier-no:1337',
        isDeleted: false,
      },
      {
        party: 'urn:altinn:organization:identifier-sub:2',
        partyType: 'Organization',
        isAccessManager: true,
        isMainAdministrator: true,
        name: 'TESTBEDRIFT AS AVD OSLO',
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:person:identifier-no:1337',
        isDeleted: false,
      },
      {
        party: 'urn:altinn:organization:identifier-sub:3',
        partyType: 'Organization',
        isAccessManager: true,
        isMainAdministrator: true,
        name: 'TESTBEDRIFT AS',
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:person:identifier-no:1337',
        isDeleted: false,
      },
    ],
    isAccessManager: true,
    isMainAdministrator: true,
    name: 'TESTBEDRIFT AS',
    isCurrentEndUser: false,
    isDeleted: false,
      partyUuid: 'urn:altinn:person:identifier-no:1337',
    hasOnlyAccessToSubParties: false,
  },
];
