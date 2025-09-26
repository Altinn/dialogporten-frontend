import { formatDisplayName } from '@altinn/altinn-components';
import type { PartyFieldsFragment, SubPartyFieldsFragment } from 'bff-types-generated';
type PartyField = PartyFieldsFragment | SubPartyFieldsFragment;

/* normalizes the parties and sub parties to title case and returns a flatten lists of PartyFieldsFragment
 where name of parent differs from sub parties
 */
export const normalizeFlattenParties = (parties: PartyFieldsFragment[]): PartyFieldsFragment[] => {
  const partiesInTitleCase =
    parties.map((party) => ({
      ...party,
      name: formatDisplayName({
        fullName: party.name,
        type: party.partyType === 'Person' ? 'person' : 'company',
        reverseNameOrder: party.partyType === 'Person',
      }),
      subParties: party.subParties?.map((subParty) => ({
        ...subParty,
        name: formatDisplayName({
          fullName: subParty.name,
          type: subParty.partyType === 'Person' ? 'person' : 'company',
          reverseNameOrder: subParty.partyType === 'Person',
        }),
        isCurrentEndUser: false,
        isDeleted: party.isDeleted,
      })),
    })) ?? [];

  return partiesInTitleCase.reduce<PartyField[]>((acc, party) => {
    const subParties = party.subParties ?? [];

    const subPartiesNotMatchingParentByName = subParties.filter(
      (subParty) => subParty.name.toLowerCase() !== party.name.toLowerCase(),
    );
    const subPartiesMatchingParentByName = subParties.filter(
      (subParty) => subParty.name.toLowerCase() === party.name.toLowerCase(),
    );

    // Skip parent if it's only allowed to access sub-parties
    if (party.hasOnlyAccessToSubParties) {
      // Promote sub-parties with different name
      acc.push(...subParties);
    } else {
      // Include parent, and attach only matching sub-parties
      acc.push({
        ...party,
        subParties: subPartiesMatchingParentByName,
      });
      // Promote others
      acc.push(...subPartiesNotMatchingParentByName);
    }

    return acc;
  }, []) as PartyFieldsFragment[];
};
