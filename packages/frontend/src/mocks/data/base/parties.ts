import type { PartyFieldsFragment } from 'bff-types-generated';

export const parties: PartyFieldsFragment[] = [
  {
    party: 'urn:altinn:person:identifier-no:1',
    partyType: 'Person',
    subParties: [],
    name: 'TEST TESTESEN',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:test-testesen',
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:organization:identifier-no:1',
    partyType: 'Organization',
    subParties: [],
    name: 'Firma AS',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:organization:uuid:firma-as',
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:organization:identifier-no:2',
    partyType: 'Organization',
    subParties: [
      {
        party: 'urn:altinn:organization:identifier-sub:1',
        partyType: 'Organization',
        name: 'TESTBEDRIFT AS AVD SUB',
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:organization:uuid:testbedrift-avd-sub',
        isDeleted: false,
      },
      {
        party: 'urn:altinn:organization:identifier-sub:2',
        partyType: 'Organization',
        name: 'TESTBEDRIFT AS AVD OSLO',
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:organization:uuid:testbedrift-avd-oslo',
        isDeleted: false,
      },
      {
        party: 'urn:altinn:organization:identifier-sub:3',
        partyType: 'Organization',
        name: 'TESTBEDRIFT AS',
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:organization:uuid:testbedrift-sub',
        isDeleted: false,
      },
    ],
    name: 'TESTBEDRIFT AS',
    isCurrentEndUser: false,
    isDeleted: false,
      partyUuid: 'urn:altinn:organization:uuid:testbedrift-main',
    hasOnlyAccessToSubParties: false,
  },
];
