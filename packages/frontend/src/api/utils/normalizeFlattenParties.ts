import type { PartyFieldsFragment, SubPartyFieldsFragment } from 'bff-types-generated';
type PartyField = PartyFieldsFragment | SubPartyFieldsFragment;

import { toTitleCase } from '../../profile';

/* normalizes the parties and sub parties to title case and returns a flatten lists of PartyFieldsFragment
 where name of parent differs from sub parties
 */
export const normalizeFlattenParties = (parties: PartyFieldsFragment[]): PartyFieldsFragment[] => {
  const partiesInTitleCase =
    parties.map((party) => ({
      ...party,
      name: toTitleCase(party.name),
      subParties: party.subParties?.map((subParty) => ({
        ...subParty,
        name: toTitleCase(subParty.name),
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
    acc.push({
      ...party,
      subParties: subPartiesMatchingParentByName,
    });
    acc.push(...subPartiesNotMatchingParentByName);

    return acc;
  }, []) as PartyFieldsFragment[];
};
