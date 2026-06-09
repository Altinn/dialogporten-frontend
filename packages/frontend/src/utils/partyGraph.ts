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
 * Cache keyed by the (stable, immutable) party array reference. `useParties` is mounted in many
 * components and React Query hands every consumer the same array reference (staleTime: Infinity), so
 * memoizing here computes the graph once per data load instead of once per consumer/observer. The
 * WeakMap lets the graph be garbage-collected together with its source array.
 */
const graphCache = new WeakMap<PartyFieldsFragment[], PartyGraph>();

/**
 * Builds a precomputed graph from the normalized (flattened) party list in a single O(n) pass.
 * Provides O(1) lookups by URN and UUID, with pre-resolved parent↔child relationships.
 * Memoized by input reference — repeated calls with the same array return the cached graph.
 */
export function buildPartyGraph(parties: PartyFieldsFragment[]): PartyGraph {
  const cached = graphCache.get(parties);
  if (cached) return cached;

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

  const graph: PartyGraph = { partyByUrn, partyByUuid, parentByChildUrn, currentEndUser };
  graphCache.set(parties, graph);
  return graph;
}
