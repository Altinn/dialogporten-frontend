import { useQuery } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useSearchParams } from 'react-router-dom';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import type { PartyGraph } from '../../utils/partyGraph.ts';
import { EMPTY_PARTY_GRAPH, buildPartyGraph } from '../../utils/partyGraph.ts';
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

const selectEndUserUuid = (parties: PartyFieldsFragment[]) => parties.find((p) => p.isCurrentEndUser)?.partyUuid;

const selectFirstPartyUuid = (parties: PartyFieldsFragment[]) => (parties as PartyFieldsFragment[])[0]?.partyUuid;

const selectFirstPartyType = (parties: PartyFieldsFragment[]) => (parties as PartyFieldsFragment[])[0]?.partyType;

const selectPartyIds = (parties: PartyFieldsFragment[]) => parties.map((p) => p.party);

const selectSelfIdentifiedUserType = (parties: PartyFieldsFragment[]): SelfIdentifiedUserType => {
  const endUser = parties.find((p) => p.isCurrentEndUser);
  if (!endUser || endUser.partyType !== 'SelfIdentified') return 'None';
  if (endUser.party.includes('urn:altinn:person:idporten-email:')) return 'Email';
  if (endUser.party.includes('urn:altinn:person:legacy-selfidentified:')) return 'Legacy';
  return 'None';
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

const allOrgsQueryOptions = {
  queryKey: [QUERY_KEYS.ALL_ORGANIZATIONS_SELECTED],
  staleTime: Number.POSITIVE_INFINITY,
  enabled: false,
  initialData: false,
  queryFn: async () => false,
} as const;

/**
 * Returns the current party UUID.
 * Uses `select` to extract only the UUID from each subscription,
 * so re-renders only when the actual UUID changes.
 */
export const useCurrentPartyUuid = (): string | undefined => {
  const { data: allOrganizationsSelected = false } = useQuery(allOrgsQueryOptions);
  const { data: selectedPartyUuid } = useQuery({ ...selectedPartiesQueryOptions, select: selectFirstPartyUuid });
  const { data: endUserUuid } = useQuery({ ...partiesQueryOptions, select: selectEndUserUuid });

  return allOrganizationsSelected ? endUserUuid : selectedPartyUuid;
};

/**
 * Returns the selected profile type ('company' | 'person' | 'neutral').
 * Uses `select` on SELECTED_PARTIES to extract only the partyType.
 */
export const useSelectedProfile = (): ProfileType => {
  const { data: allOrganizationsSelected = false } = useQuery(allOrgsQueryOptions);
  const { data: firstPartyType } = useQuery({ ...selectedPartiesQueryOptions, select: selectFirstPartyType });
  const [searchParams] = useSearchParams();

  if (allOrganizationsSelected) return 'neutral';

  const party = searchParams.get('party');
  const allParties = searchParams.get('allParties');
  const isCompanyFromParams = Boolean(party || allParties);
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
 * Returns whether the user is self-identified.
 * Subscribes only to: IS_SELF_IDENTIFIED_USER (a boolean, minimal subscription).
 */
export const useIsSelfIdentifiedUser = (): boolean => {
  const { data = false } = useQuery({
    queryKey: [QUERY_KEYS.IS_SELF_IDENTIFIED_USER],
    staleTime: Number.POSITIVE_INFINITY,
    enabled: false,
    initialData: false,
    queryFn: async () => false,
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
