import type { AuthorizedParty } from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import type { PartyGraph } from '../../api/utils/partyGraph.ts';

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

/**
 * Converts the flat party list into a hierarchical AuthorizedParty[] structure.
 *
 * When a `partyGraph` is provided (O(1) lookups), uses `party.parentParty` to
 * filter out promoted sub-parties and `party.subParties` for nesting.
 *
 * Falls back to the legacy approach (build a Set of sub-party UUIDs) when no graph is available.
 */
export const mapPartiesToAuthorizedParties = (
  parties: PartyFieldsFragment[],
  partyGraph?: PartyGraph,
): AuthorizedParty[] => {
  if (partyGraph) {
    return partyGraph.parties
      .filter((party) => !party.parentParty)
      .map((party) => ({
        ...toAuthorizedParty(party),
        subunits: party.subParties.length > 0 ? party.subParties.map(toAuthorizedParty) : undefined,
      }));
  }

  // Legacy fallback
  const subPartyUuids = new Set(parties.flatMap((party) => party.subParties?.map((sub) => sub.partyUuid) ?? []));

  return parties
    .filter((party) => !subPartyUuids.has(party.partyUuid))
    .map((party) => ({
      ...toAuthorizedParty(party),
      subunits: party.subParties?.map(toAuthorizedParty),
    }));
};
