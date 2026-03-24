import type { PartyFieldsFragment } from 'bff-types-generated';

/**
 * Enriched party type that precomputes all relationships and derived fields.
 * Built once in a single O(n) pass by `buildPartyGraph`, cached by React Query.
 *
 * Replaces `PartyFieldsFragment` in all downstream consumers — no more
 * repeated `.find()` / `.some()` scans to resolve parent-child relationships.
 */
export interface Party {
  /** URN identifier, e.g. "urn:altinn:organization:identifier-no:910000001" */
  party: string;
  partyType: string;
  name: string;
  partyUuid: string;
  partyId: number;
  isCurrentEndUser: boolean;
  isDeleted: boolean;
  hasOnlyAccessToSubParties: boolean;
  dateOfBirth?: string | null;

  // --- Precomputed relationships ---

  /** True if this party has child sub-parties (non-empty subParties). */
  isParent: boolean;
  /** Direct reference to the parent party, or undefined if top-level. */
  parentParty: Party | undefined;
  /** Direct child sub-parties. Empty array if leaf node. */
  subParties: Party[];

  // --- Precomputed derived fields ---

  isPerson: boolean;
  isOrganization: boolean;
}

export interface PartyGraph {
  /** Flat list of all parties (parents + promoted sub-parties). */
  parties: Party[];
  /** O(1) lookup by party URN (e.g. "urn:altinn:organization:identifier-no:..."). */
  partyByUrn: Map<string, Party>;
  /** O(1) lookup by partyUuid. */
  partyByUuid: Map<string, Party>;
  /** The logged-in user's own party (isCurrentEndUser). */
  currentEndUser: Party | undefined;
}

/**
 * Builds the enriched `PartyGraph` from the normalized flat party list.
 *
 * Input: the output of `normalizeFlattenParties` — a flat list where:
 * - Parent orgs appear with their original `subParties` array intact
 * - Sub-parties are also promoted to top-level entries (without a `subParties` array)
 *
 * This function does a single linear pass to:
 * 1. Create `Party` objects for every entry
 * 2. Build URN and UUID lookup maps
 * 3. Resolve parent↔child references using the original `subParties` arrays
 */
export function buildPartyGraph(normalizedParties: PartyFieldsFragment[]): PartyGraph {
  const partyByUrn = new Map<string, Party>();
  const partyByUuid = new Map<string, Party>();
  let currentEndUser: Party | undefined;

  // Pass 1: Create Party objects and index them
  for (const raw of normalizedParties) {
    // Skip duplicates — promoted sub-parties may share a URN with their nested entry
    if (partyByUrn.has(raw.party)) continue;

    const party: Party = {
      party: raw.party,
      partyType: raw.partyType,
      name: raw.name,
      partyUuid: raw.partyUuid,
      partyId: raw.partyId,
      isCurrentEndUser: raw.isCurrentEndUser,
      isDeleted: raw.isDeleted,
      hasOnlyAccessToSubParties: raw.hasOnlyAccessToSubParties ?? false,
      dateOfBirth: raw.dateOfBirth,

      // Will be resolved in pass 2
      isParent: false,
      parentParty: undefined,
      subParties: [],

      isPerson: raw.partyType === 'Person' || raw.partyType === 'SelfIdentified',
      isOrganization: raw.partyType === 'Organization',
    };

    partyByUrn.set(party.party, party);
    partyByUuid.set(party.partyUuid, party);

    if (raw.isCurrentEndUser) {
      currentEndUser = party;
    }
  }

  // Pass 2: Resolve parent↔child references
  // Only entries with a non-empty subParties array are parents.
  for (const raw of normalizedParties) {
    const rawSubs = raw.subParties;
    if (!rawSubs || rawSubs.length === 0) continue;

    const parent = partyByUrn.get(raw.party);
    if (!parent) continue;

    parent.isParent = true;
    const children: Party[] = [];

    for (const rawSub of rawSubs) {
      let child = partyByUrn.get(rawSub.party);

      // Sub-party may not exist as a top-level entry (e.g. when the input
      // isn't from normalizeFlattenParties, or in test fixtures).
      // Create and index it so all lookups work regardless.
      if (!child) {
        child = {
          party: rawSub.party,
          partyType: rawSub.partyType,
          name: rawSub.name,
          partyUuid: rawSub.partyUuid,
          partyId: rawSub.partyId,
          isCurrentEndUser: rawSub.isCurrentEndUser,
          isDeleted: rawSub.isDeleted,
          hasOnlyAccessToSubParties: false,
          dateOfBirth: rawSub.dateOfBirth,
          isParent: false,
          parentParty: undefined,
          subParties: [],
          isPerson: rawSub.partyType === 'Person' || rawSub.partyType === 'SelfIdentified',
          isOrganization: rawSub.partyType === 'Organization',
        };
        partyByUrn.set(child.party, child);
        partyByUuid.set(child.partyUuid, child);
      }

      child.parentParty = parent;
      children.push(child);
    }

    parent.subParties = children;
  }

  // Build the flat output list preserving insertion order but deduped
  const parties = Array.from(partyByUrn.values());

  return {
    parties,
    partyByUrn,
    partyByUuid,
    currentEndUser,
  };
}
