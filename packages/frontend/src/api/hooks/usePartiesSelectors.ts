/**
 * Fine-grained hooks that subscribe to only a slice of party state.
 *
 * `useParties()` subscribes to 7 separate state sources (5 global states,
 * 1 query, 1 searchParams).  Every consumer re-renders when *any* of them
 * changes.  These focused hooks let components subscribe only to what they
 * need, drastically reducing unnecessary re-renders (especially for the
 * 8+ components that only need `currentPartyUuid`).
 */

import type { PartyFieldsFragment } from 'bff-types-generated';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { updatePartyCookies } from '../../cookie.ts';
import { FixedGlobalQueryParams } from '../../pages/Inbox/queryParams.ts';
import { useGlobalState } from '../../useGlobalState.ts';
import { graphQLSDK } from '../queries.ts';
import { normalizeFlattenParties } from '../utils/normalizeFlattenParties.ts';
import { type PartyGraph, buildPartyGraph } from '../utils/partyGraph.ts';
import type { ProfileType } from './useParties.ts';

const emptyGraph: PartyGraph = {
  parties: [],
  partyByUrn: new Map(),
  partyByUuid: new Map(),
  currentEndUser: undefined,
};

const partiesQueryOptions = {
  queryKey: [QUERY_KEYS.PARTIES],
  queryFn: async () => {
    const response = await graphQLSDK.parties();
    return normalizeFlattenParties(response.parties);
  },
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  retry: 2,
  retryDelay: 500,
};

/**
 * Returns the precomputed `PartyGraph` with O(1) lookup maps.
 *
 * Only re-renders when the underlying parties data changes (effectively
 * never after initial load because of `staleTime: Infinity`).
 *
 * Use this instead of `useParties()` when you only need `partyGraph`.
 */
export const usePartyGraph = (): PartyGraph => {
  const { data } = useAuthenticatedQuery<PartyFieldsFragment[]>(partiesQueryOptions);

  return useMemo<PartyGraph>(() => {
    if (!data) return emptyGraph;
    return buildPartyGraph(data);
  }, [data]);
};

/**
 * Returns just the current party UUID string.
 *
 * Only re-renders when the selected party or allOrganizationsSelected
 * changes — NOT when search input, filters, or other unrelated state
 * changes.
 *
 * Use this instead of `useParties()` in components like Footer,
 * BetaModal, EmptyState, FloatingDropdown, AlertBanner.
 */
export const useCurrentPartyUuid = (): string | undefined => {
  const { data } = useAuthenticatedQuery<PartyFieldsFragment[]>(partiesQueryOptions);
  const [selectedParties] = useGlobalState<PartyFieldsFragment[]>(QUERY_KEYS.SELECTED_PARTIES, []);
  const [allOrganizationsSelected] = useGlobalState<boolean>(QUERY_KEYS.ALL_ORGANIZATIONS_SELECTED, false);

  return useMemo(() => {
    const currentEndUser = data?.find((party) => party.isCurrentEndUser);
    return allOrganizationsSelected ? currentEndUser?.partyUuid : selectedParties[0]?.partyUuid;
  }, [data, selectedParties, allOrganizationsSelected]);
};

/**
 * Returns just the profile type ('company' | 'person' | 'neutral').
 *
 * Use this instead of `useParties()` in OnboardingPopover etc.
 */
export const useSelectedProfile = (): ProfileType => {
  const [selectedParties] = useGlobalState<PartyFieldsFragment[]>(QUERY_KEYS.SELECTED_PARTIES, []);
  const [allOrganizationsSelected] = useGlobalState<boolean>(QUERY_KEYS.ALL_ORGANIZATIONS_SELECTED, false);
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const party = searchParams.get('party');
    const allParties = searchParams.get('allParties');
    const isCompanyFromParams = Boolean(party || allParties);
    const isCompanyProfile =
      isCompanyFromParams || allOrganizationsSelected || selectedParties?.[0]?.partyType === 'Organization';
    return allOrganizationsSelected ? 'neutral' : isCompanyProfile ? 'company' : 'person';
  }, [selectedParties, allOrganizationsSelected, searchParams]);
};

/**
 * Returns just the selected party ID strings.
 *
 * Use this instead of `useParties()` in SaveSearchButton etc.
 */
export const useSelectedPartyIds = (): string[] => {
  const [selectedParties] = useGlobalState<PartyFieldsFragment[]>(QUERY_KEYS.SELECTED_PARTIES, []);

  return useMemo(() => selectedParties.map((party) => party.party) ?? [], [selectedParties]);
};

/**
 * Returns just the allOrganizationsSelected boolean.
 *
 * Use this instead of `useParties()` in useGroupedDialogs etc.
 */
export const useAllOrganizationsSelected = (): boolean => {
  const [allOrganizationsSelected] = useGlobalState<boolean>(QUERY_KEYS.ALL_ORGANIZATIONS_SELECTED, false);
  return allOrganizationsSelected;
};

/**
 * Returns just the current end-user party.
 *
 * Only re-renders when the underlying parties data changes (effectively
 * never after initial load because of `staleTime: Infinity`).
 *
 * Use this instead of `useParties()` in useGlobalMenu etc.
 */
export const useCurrentEndUser = (): PartyFieldsFragment | undefined => {
  const { data } = useAuthenticatedQuery<PartyFieldsFragment[]>(partiesQueryOptions);
  return useMemo(() => data?.find((party) => party.isCurrentEndUser), [data]);
};

/**
 * Returns the full selected parties array.
 *
 * Only re-renders when the selected parties change — NOT when search
 * input, filters, or other unrelated state changes.
 */
export const useSelectedParties = (): PartyFieldsFragment[] => {
  const [selectedParties] = useGlobalState<PartyFieldsFragment[]>(QUERY_KEYS.SELECTED_PARTIES, []);
  return selectedParties;
};

/**
 * Returns just the loading state of the parties query.
 *
 * Only re-renders when the loading state changes (once, on initial load).
 */
export const usePartiesLoading = (): boolean => {
  const { isLoading } = useAuthenticatedQuery<PartyFieldsFragment[]>(partiesQueryOptions);
  return isLoading;
};

export const stripQueryParamsForPersonParty = (searchParamString: string) => {
  const params = new URLSearchParams(searchParamString);
  params.delete(FixedGlobalQueryParams.party);
  params.delete(FixedGlobalQueryParams.allParties);
  params.delete(FixedGlobalQueryParams.subAccounts);
  return params.toString();
};

const createPartyParams = (searchParamString: string, key: string, value: string): URLSearchParams => {
  const params = new URLSearchParams(searchParamString);
  params.delete(FixedGlobalQueryParams.allParties);
  params.delete(FixedGlobalQueryParams.party);
  params.set(key, value);
  return params;
};

/**
 * Returns just the `setSelectedPartyIds` setter function.
 *
 * Subscribes to: parties query, searchParams, SELECTED_PARTIES,
 * ALL_ORGANIZATIONS_SELECTED, IS_SELF_IDENTIFIED_USER.
 *
 * Does NOT subscribe to: ALTINN_COOKIE, PARTIES_EMPTY_LIST — the two
 * "noisy" state sources that caused unnecessary re-renders in the full
 * `useParties()` hook.
 */
export const useSetSelectedPartyIds = (): ((partyIds: string[], allOrgSelected: boolean) => void) => {
  const { data } = useAuthenticatedQuery<PartyFieldsFragment[]>(partiesQueryOptions);
  const [, setSearchParams] = useSearchParams();
  const [, setSelectedParties] = useGlobalState<PartyFieldsFragment[]>(QUERY_KEYS.SELECTED_PARTIES, []);
  const [, setAllOrganizationsSelected] = useGlobalState<boolean>(QUERY_KEYS.ALL_ORGANIZATIONS_SELECTED, false);
  const [isSelfIdentifiedUser] = useGlobalState<boolean>(QUERY_KEYS.IS_SELF_IDENTIFIED_USER, false);

  return useCallback(
    (partyIds: string[], allOrgSelected: boolean) => {
      setAllOrganizationsSelected(allOrgSelected);
      const partyIsPerson = partyIds.some((partyId) => partyId.includes('person')) || isSelfIdentifiedUser;
      const searchParamsString = new URLSearchParams(window.location.search).toString();

      const handleChangeSearchParams = (newParams: URLSearchParams) => {
        if (newParams.toString() !== new URLSearchParams(window.location.search).toString()) {
          setSearchParams(newParams, { replace: true });
        }
      };

      if (allOrgSelected) {
        const allPartiesParams = createPartyParams(searchParamsString, FixedGlobalQueryParams.allParties, 'true');
        handleChangeSearchParams(allPartiesParams);
      } else if (partyIsPerson) {
        const personParams = new URLSearchParams(stripQueryParamsForPersonParty(searchParamsString));
        handleChangeSearchParams(personParams);
      } else {
        const params = createPartyParams(searchParamsString, FixedGlobalQueryParams.party, partyIds[0]);
        handleChangeSearchParams(params);
      }

      const matchedParties = data?.filter((party) => partyIds.includes(party.party)) ?? [];
      if (matchedParties.length) {
        setSelectedParties(matchedParties);
      }

      const selectedParty = matchedParties[0];
      if (selectedParty?.partyUuid) {
        updatePartyCookies({
          partyUuid: selectedParty.partyUuid,
          partyId: selectedParty.partyId,
        });
      }
    },
    [data, setSearchParams, setSelectedParties, setAllOrganizationsSelected, isSelfIdentifiedUser],
  );
};
