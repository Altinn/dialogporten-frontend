import type { Person } from 'bff-types-generated';

export const buildAddressString = (person: Person | undefined | null) => {
  if (!person) {
    return '';
  }
  const street = person.addressStreetName || '';
  const houseNumber = person.addressHouseNumber || '';
  const houseLetter = person.addressHouseLetter || '';
  const municipalNumber = person.addressMunicipalNumber || '';
  const municipalName = person.addressMunicipalName || '';

  return `${street} ${houseNumber}${houseLetter}, ${municipalNumber} ${municipalName}`;
};
