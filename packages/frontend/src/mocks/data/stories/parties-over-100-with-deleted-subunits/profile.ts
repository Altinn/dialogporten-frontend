import type { Profile } from 'bff-types-generated';

/**
 * Same as the base profile but with shouldShowDeletedEntities = false.
 * This is the setting that triggers the bug: deleted sub-units are hidden
 * from the visible count yet still counted by getPartyIds(). With the base
 * profile's `true`, deleted units are also counted in the visible list, so
 * the counts match and the divergence disappears.
 */
export const profile: Profile = {
  updatedAt: '1727691732707',
  language: 'nb',
  user: {
    userId: 20625133,
    userUuid: '8666f00a-deda-4d00-a02d-092effc1170d',
    userName: '',
    email: 'nullstilt@altinn.xyz',
    isReserved: false,
    phoneNumber: '+4748995855',
    externalIdentity: '',
    partyId: 1,
    profileSettingPreference: {
      shouldShowDeletedEntities: false,
      preselectedPartyUuid: null,
    },
    party: {
      partyId: 1,
      partyUuid: 'urn:altinn:person:uuid:stortest-person',
      partyTypeName: 1,
      orgNumber: '',
      ssn: '22816298923',
      unitType: null,
      name: 'STORTEST PERSON',
      isDeleted: false,
      onlyHierarchyElementWithNoAccess: false,
      person: {
        ssn: '22816298923',
        name: 'STORTEST PERSON',
        firstName: 'STORTEST',
        middleName: '',
        lastName: 'PERSON',
        telephoneNumber: '',
        mobileNumber: '',
        mailingAddress: 'Kirkegata 25',
        mailingPostalCode: '4307',
        mailingPostalCity: 'SANDNES',
        addressMunicipalNumber: '1108',
        addressMunicipalName: 'SANDNES',
        addressStreetName: 'Kirkegata',
        addressHouseNumber: '0025',
        addressHouseLetter: '',
        addressPostalCode: '4307',
        addressCity: 'SANDNES',
        dateOfDeath: null,
      },
    },
  },
};
