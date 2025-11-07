import type { AuthorizedParty } from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';

//TODO: Date of birth not available in party API
/**
 * Extracts the identifier number from URN format
 * Format: "urn:altinn:{type}:identifier-no:{number}"
 * Returns just the number part
 */
const extractIdentifierNumber = (partyId: string): string | undefined => {
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

  const day = ssn.slice(0, 2);
  const month = ssn.slice(2, 4);
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

  return `${fullYear}-${month}-${day}`;
};

export const mapPartiesToAuthorizedParties = (parties: PartyFieldsFragment[]): AuthorizedParty[] => {
  return parties.flatMap((party) => {
    const mainParty: AuthorizedParty = {
      partyUuid: party.partyUuid,
      name: party.name,
      partyId: party.party,
      type: party.partyType,
      isDeleted: party.isDeleted,
      onlyHierarchyElementWithNoAccess: party.hasOnlyAccessToSubParties,
      authorizedResources: [],
      authorizedRoles: [],
      dateOfBirth: party.partyType === 'Person' ? extractDateOfBirthFromSSN(party.party) : undefined,
      organizationNumber: party.partyType === 'Organization' ? extractIdentifierNumber(party.party) : undefined,
      subunits: party.subParties?.map((subParty) => {
        return {
          partyUuid: subParty.partyUuid,
          name: subParty.name,
          partyId: subParty.party,
          type: subParty.partyType,
          dateOfBirth: subParty.partyType === 'Person' ? extractDateOfBirthFromSSN(subParty.party) : undefined,
          isDeleted: subParty.isDeleted,
          onlyHierarchyElementWithNoAccess: false,
          authorizedResources: [],
          authorizedRoles: [],
          organizationNumber:
            subParty.partyType === 'Organization' ? extractIdentifierNumber(subParty.party) : undefined,
        };
      }),
    };

    return [mainParty];
  });
};
