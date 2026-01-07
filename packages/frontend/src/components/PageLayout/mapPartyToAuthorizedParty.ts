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
    dateOfBirth: party.dateOfBirth,
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
