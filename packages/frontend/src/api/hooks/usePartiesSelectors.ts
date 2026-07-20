import { useQuery } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useSearchParams } from 'react-router-dom';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { getSelectedGroupFromQueryParams, type PartyGroup } from '../../pages/Inbox/queryParams.ts';
import type { PartyGraph } from '../../utils/partyGraph.ts';
import { buildPartyGraph, EMPTY_PARTY_GRAPH } from '../../utils/partyGraph.ts';
import type { ProfileType, SelfIdentifiedUserType } from './useParties.ts';

/**
 * These selector hooks use React Query's `select` option to narrow subscriptions.
 * `select` is auto-memoized when the function reference is stable (extracted, not inline),
 * and structural sharing ensures the component only re-renders when the selected value
 * actually changes — not when the underlying cache entry changes.
 *
 * See: https://tanstack.com/query/v5/docs/framework/react/guides/render-optimizations
 */

/* ── Stable selector functions (never recreated, so React Query memoizes the result) ── */
const selectCurrentEndUser = (parties: PartyFieldsFragment[]) => parties.find((p) => p.isCurrentEndUser);

const selectFirstPartyType = (parties: PartyFieldsFragment[]) => (parties as PartyFieldsFragment[])[0]?.partyType;

const selectPartyIds = (parties: PartyFieldsFragment[]) => parties.map((p) => p.party);

/**
 * True when the user has no parties besides themselves (the flattened `parties`
 * array always contains the current end user's own entry).
 */
export const hasOnlySelfParty = (parties: PartyFieldsFragment[]): boolean => parties.length <= 1;

const selectSelfIdentifiedUserType = (parties: PartyFieldsFragment[]): SelfIdentifiedUserType => {
  const endUser = parties.find((p) => p.isCurrentEndUser);
  if (endUser?.partyType !== 'SelfIdentified') return 'None';
  if (endUser.party.includes('urn:altinn:person:idporten-email:')) return 'Email';
  if (endUser.party.includes('urn:altinn:person:legacy-selfidentified:')) return 'Legacy';
  return 'None';
};

const SI_LEGACY_URN_PREFIX = 'urn:altinn:person:legacy-selfidentified:';

export interface SILegacyPartyInfo {
  party: string;
  name: string;
}

const EMPTY_SI_LEGACY_PARTIES: SILegacyPartyInfo[] = [];

const selectSILegacyParties = (parties: PartyFieldsFragment[]): SILegacyPartyInfo[] => {
  const result: SILegacyPartyInfo[] = [];
  for (const party of parties) {
    if (party.party?.startsWith(SI_LEGACY_URN_PREFIX)) {
      result.push({ party: party.party, name: party.name });
    }
    const subs = party.subParties;
    if (!subs) continue;
    for (const sub of subs) {
      if (sub.party?.startsWith(SI_LEGACY_URN_PREFIX)) {
        result.push({ party: sub.party, name: sub.name });
      }
    }
  }
  // Stable empty-array reference avoids spurious re-renders for users with no legacy parties.
  return result.length > 0 ? result : EMPTY_SI_LEGACY_PARTIES;
};

/* ── Shared query options (no fetch, just read from cache) ── */
const partiesQueryOptions = {
  queryKey: [QUERY_KEYS.PARTIES],
  staleTime: Number.POSITIVE_INFINITY,
  enabled: false,
  queryFn: async () => [] as PartyFieldsFragment[],
};

const selectedPartiesQueryOptions = {
  queryKey: [QUERY_KEYS.SELECTED_PARTIES],
  staleTime: Number.POSITIVE_INFINITY,
  enabled: false,
  initialData: [] as PartyFieldsFragment[],
  queryFn: async () => [] as PartyFieldsFragment[],
};

const selectedGroupQueryOptions = {
  queryKey: [QUERY_KEYS.SELECTED_GROUP],
  staleTime: Number.POSITIVE_INFINITY,
  enabled: false,
  initialData: null as PartyGroup | null,
  queryFn: async () => null as PartyGroup | null,
};

/**
 * Returns the selected profile type ('company' | 'person' | 'neutral').
 * Uses `select` on SELECTED_PARTIES to extract only the partyType.
 */
export const useSelectedProfile = (): ProfileType => {
  const { data: selectedGroup = null } = useQuery(selectedGroupQueryOptions);
  const { data: firstPartyType } = useQuery({ ...selectedPartiesQueryOptions, select: selectFirstPartyType });
  const [searchParams] = useSearchParams();

  if (selectedGroup || getSelectedGroupFromQueryParams(searchParams)) return 'neutral';

  const isCompanyFromParams = Boolean(searchParams.get('party'));
  const isCompanyProfile = isCompanyFromParams || firstPartyType === 'Organization';

  return isCompanyProfile ? 'company' : 'person';
};

/**
 * Returns a precomputed PartyGraph for O(1) lookups.
 * `buildPartyGraph` is a stable reference — React Query only re-runs it when data changes.
 * Note: PartyGraph uses Maps which aren't structurally sharable,
 * but PARTIES data is immutable (staleTime: Infinity) so this is fine.
 */
export const usePartyGraph = (): PartyGraph => {
  const { data } = useQuery({
    ...partiesQueryOptions,
    select: buildPartyGraph,
  });
  return data ?? EMPTY_PARTY_GRAPH;
};

/**
 * Returns the current end user party.
 * Uses `select` with structural sharing — same reference returned if end user unchanged.
 */
export const useCurrentEndUser = (): PartyFieldsFragment | undefined => {
  const { data } = useQuery({
    ...partiesQueryOptions,
    select: selectCurrentEndUser,
  });
  return data;
};

/**
 * Returns the self-identified user type.
 * Uses `select` to derive the type directly — returns a primitive string,
 * so structural sharing ensures no re-render unless the type actually changes.
 */
export const useSelfIdentifiedUserType = (): SelfIdentifiedUserType => {
  const { data = 'None' } = useQuery({
    ...partiesQueryOptions,
    select: selectSelfIdentifiedUserType,
  });
  return data;
};

/**
 * Returns whether the user has no parties besides themselves.
 * Subscribes only to a derived boolean, for callers that don't otherwise need useParties().
 */
export const useHasOnlySelfParty = (): boolean => {
  const { data = false } = useQuery({
    ...partiesQueryOptions,
    select: hasOnlySelfParty,
  });
  return data;
};

/**
 * Returns the user's SI legacy-selfidentified parties (top-level or sub-party).
 * Returns a stable empty-array reference when none are present.
 * Useful for showing legacy usernames alongside the Email account.
 */
export const useSILegacyParties = (): SILegacyPartyInfo[] => {
  const { data = EMPTY_SI_LEGACY_PARTIES } = useQuery({
    ...partiesQueryOptions,
    select: selectSILegacyParties,
  });
  return data;
};

/**
 * Returns the selected party IDs (URNs).
 * Uses `select` to map to string[] — structural sharing preserves the array reference
 * when the IDs haven't changed, preventing downstream re-renders.
 */
export const useSelectedPartyIds = (): string[] => {
  const { data = [] } = useQuery({
    ...selectedPartiesQueryOptions,
    select: selectPartyIds,
  });
  return data;
};
