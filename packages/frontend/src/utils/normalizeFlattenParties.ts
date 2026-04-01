import { formatDisplayName } from '@altinn/altinn-components';
import type { PartyFieldsFragment, SubPartyFieldsFragment } from 'bff-types-generated';
type PartyField = PartyFieldsFragment | SubPartyFieldsFragment;

/* normalizes the parties and sub parties to title case and returns a flatten lists of PartyFieldsFragment
 where name of parent differs from sub parties
 */
export const normalizeFlattenParties = (parties: PartyFieldsFragment[]): PartyFieldsFragment[] => {
  const result: PartyField[] = [];
  /* Cache formatted names – many sub-parties share the same name/type combination */
  const nameCache = new Map<string, string>();
  const cachedFormat = (fullName: string, type: 'person' | 'company'): string => {
    const key = `${type}:${fullName}`;
    let cached = nameCache.get(key);
    if (cached === undefined) {
      cached = formatDisplayName({ fullName, type });
      nameCache.set(key, cached);
    }
    return cached;
  };

  for (const party of parties) {
    const partyType = party.partyType === 'Person' ? 'person' : 'company';
    const subParties =
      party.subParties?.map((subParty) => ({
        ...subParty,
        name: cachedFormat(subParty.name, subParty.partyType === 'Person' ? 'person' : 'company'),
      })) ?? [];

    result.push({
      ...party,
      name: cachedFormat(party.name, partyType),
      subParties,
    });

    for (const sub of subParties) {
      result.push(sub);
    }
  }

  return result as PartyFieldsFragment[];
};
