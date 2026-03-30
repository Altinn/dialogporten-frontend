import type { PartyFieldsFragment } from 'bff-types-generated';

export interface PartyGraph {
  /** O(1) lookup of any party (top-level or promoted sub-party) by its URN */
  partyByUrn: Map<string, PartyFieldsFragment>;
  /** O(1) lookup of any party by its UUID */
  partyByUuid: Map<string, PartyFieldsFragment>;
  /** O(1) lookup of parent party for a sub-party, keyed by sub-party URN */
  parentByChildUrn: Map<string, PartyFieldsFragment>;
  /** The current end user party (first match) */
  currentEndUser: PartyFieldsFragment | undefined;
}

export const EMPTY_PARTY_GRAPH: PartyGraph = {
  partyByUrn: new Map(),
  partyByUuid: new Map(),
  parentByChildUrn: new Map(),
  currentEndUser: undefined,
};

/**
 * Builds a precomputed graph from the normalized (flattened) party list in a single O(n) pass.
 * Provides O(1) lookups by URN and UUID, with pre-resolved parent↔child relationships.
 */
export function buildPartyGraph(parties: PartyFieldsFragment[]): PartyGraph {
  const partyByUrn = new Map<string, PartyFieldsFragment>();
  const partyByUuid = new Map<string, PartyFieldsFragment>();
  const parentByChildUrn = new Map<string, PartyFieldsFragment>();
  let currentEndUser: PartyFieldsFragment | undefined;

  for (const party of parties) {
    partyByUrn.set(party.party, party);
    if (party.partyUuid) {
      partyByUuid.set(party.partyUuid, party);
    }
    if (party.isCurrentEndUser && !currentEndUser) {
      currentEndUser = party;
    }
    for (const sub of party.subParties ?? []) {
      parentByChildUrn.set(sub.party, party);
    }
  }

  return { partyByUrn, partyByUuid, parentByChildUrn, currentEndUser };
}
