import type { AuthorizedParty } from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';

//TODO: Date of birth not available in party API
/**
 * Extracts the identifier number from URN format
 * Format: "urn:altinn:{type}:identifier-no:{number}"
 * Returns just the number part
 */
export const extractIdentifierNumber = (partyId?: string): string | undefined => {
  if (!partyId) return undefined;
  const parts = partyId.split('identifier-no:');
  if (parts.length < 2) return undefined;
  return parts[1];
};

/**
 * Extracts date of birth from Norwegian SSN (fødselsnummer)
 * Format: DDMMYYXXXXX where:
 * - DD: day (01-31)
 * - MM: month (01-12)
 * - YY: year (last 2 digits)
 * - XXXXX: individual number (helps determine century)
 */
const extractDateOfBirthFromSSN = (partyId: string): string | undefined => {
  const ssn = extractIdentifierNumber(partyId);
  if (!ssn || ssn.length !== 11) return undefined;

  let day = ssn.slice(0, 2);
  let month = ssn.slice(2, 4);
  const year = ssn.slice(4, 6);
  const individualNumber = Number.parseInt(ssn.slice(6, 9), 10);

  let century: number;
  const yearNum = Number.parseInt(year, 10);

  if (individualNumber >= 500 && yearNum <= 39) {
    century = 2000;
  } else {
    century = 1900;
  }

  const fullYear = century + yearNum;

  if (+month >= 13) month = (+month - 40).toString().padStart(2, '0');
  if (+day > 31) day = (+day - 40).toString().padStart(2, '0');

  return `${fullYear}.${month}.${day}`;
};

//@ts-ignore: any type - match expecing from AuthorizedParty
const toAuthorizedParty = (party) => {
  return {
    partyUuid: party.partyUuid,
    name: party.name,
    partyId: party.party,
    type: party.partyType,
    isDeleted: party.isDeleted,
    onlyHierarchyElementWithNoAccess: party.hasOnlyAccessToSubParties ?? false,
    authorizedResources: [],
    authorizedRoles: [],
    dateOfBirth: party.partyType === 'Person' ? extractDateOfBirthFromSSN(party.party) : undefined,
    organizationNumber: party.partyType === 'Organization' ? extractIdentifierNumber(party.party) : undefined,
  };
};

export const mapPartiesToAuthorizedParties = (parties: PartyFieldsFragment[]): AuthorizedParty[] => {
  const subPartyUuids = new Set(parties.flatMap((party) => party.subParties?.map((sub) => sub.partyUuid) ?? []));

  return parties
    .filter((party) => !subPartyUuids.has(party.partyUuid))
    .map((party) => ({
      ...toAuthorizedParty(party),
      subunits: party.subParties?.map(toAuthorizedParty),
    }));
};
