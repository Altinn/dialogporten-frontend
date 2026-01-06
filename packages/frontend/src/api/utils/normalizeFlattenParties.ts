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
      }),
      subParties: party.subParties?.map((subParty) => ({
        ...subParty,
        name: formatDisplayName({
          fullName: subParty.name,
          type: subParty.partyType === 'Person' ? 'person' : 'company',
        }),
      })),
    })) ?? [];

  return partiesInTitleCase.reduce<PartyField[]>((acc, party) => {
    const subParties = party.subParties ?? [];

    acc.push({
      ...party,
      subParties,
    });
    // Promote others
    acc.push(...subParties);

    return acc;
  }, []) as PartyFieldsFragment[];
};
