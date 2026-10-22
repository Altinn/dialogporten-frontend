import type { PartyFieldsFragment } from 'bff-types-generated';
import { BAKERY_PARTY, PERSON_PARTY } from './shared.ts';

export const parties: PartyFieldsFragment[] = [
  {
    party: PERSON_PARTY,
    partyType: 'Person',
    subParties: [],
    name: 'HANSEN KARI',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:kari-hansen',
    partyId: 1,
    dateOfBirth: null,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: BAKERY_PARTY,
    partyType: 'Organization',
    subParties: [],
    name: 'SAGENE BAKERI AS',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'urn:altinn:organization:uuid:sagene-bakeri',
    partyId: 2,
    dateOfBirth: null,
    hasOnlyAccessToSubParties: false,
  },
];
