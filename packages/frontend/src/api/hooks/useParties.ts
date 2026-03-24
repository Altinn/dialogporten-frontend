import { useQueryClient } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { updatePartyCookies } from '../../cookie.ts';
import {
  FixedGlobalQueryParams,
  getSelectedAllPartiesFromQueryParams,
  getSelectedPartyFromQueryParams,
} from '../../pages/Inbox/queryParams.ts';
import { useGlobalState } from '../../useGlobalState.ts';
import { graphQLSDK } from '../queries.ts';
import { normalizeFlattenParties } from '../utils/normalizeFlattenParties.ts';
import { type PartyGraph, buildPartyGraph } from '../utils/partyGraph.ts';
import { MAX_DIALOG_PARTY_SIZE } from './useDialogs.tsx';
import { stripQueryParamsForPersonParty } from './usePartiesSelectors.ts';

export type ProfileType = 'company' | 'person' | 'neutral';

interface UsePartiesOutput {
  partyGraph: PartyGraph;
  isSuccess: boolean;
  isError: boolean;
  isLoading: boolean;
  selectedParties: PartyFieldsFragment[];
  selectedPartyIds: string[];
  setSelectedParties: (parties: PartyFieldsFragment[]) => void;
  setSelectedPartyIds: (parties: string[], allOrganizationsSelected: boolean) => void;
  currentEndUser: PartyFieldsFragment | undefined;
  allOrganizationsSelected: boolean;
  selectedProfile: ProfileType;
  partiesEmptyList: boolean;
  currentPartyUuid: string | undefined;
  isSelfIdentifiedUser: boolean;
  organizationLimitReached: boolean;
}

const createPartyParams = (searchParamString: string, key: string, value: string): URLSearchParams => {
  const params = new URLSearchParams(searchParamString);
  params.delete(FixedGlobalQueryParams.allParties);
  params.delete(FixedGlobalQueryParams.party);
  params.set(key, value);
  return params;
};

export const useParties = (): UsePartiesOutput => {
  const queryClient = useQueryClient();
  const [cookiePartyUuid] = useGlobalState(QUERY_KEYS.ALTINN_COOKIE, '');

  const [searchParams, setSearchParams] = useSearchParams();
  const [allOrganizationsSelected, setAllOrganizationsSelected] = useGlobalState<boolean>(
    QUERY_KEYS.ALL_ORGANIZATIONS_SELECTED,
    false,
  );
  const [selectedParties, setSelectedParties] = useGlobalState<PartyFieldsFragment[]>(QUERY_KEYS.SELECTED_PARTIES, []);
  const [partiesEmptyList, setPartiesEmptyList] = useGlobalState<boolean>(QUERY_KEYS.PARTIES_EMPTY_LIST, false);
  const [isSelfIdentifiedUser, setIsSelfIdentifiedUser] = useGlobalState<boolean>(
    QUERY_KEYS.IS_SELF_IDENTIFIED_USER,
    false,
  );

  const handleChangSearchParams = (newParams: URLSearchParams) => {
    /* Compare against actual current URL to avoid redundant updates */
    if (newParams.toString() !== new URLSearchParams(window.location.search).toString()) {
      setSearchParams(newParams, { replace: true });
    }
  };

  const { data, isLoading, isSuccess, isError } = useAuthenticatedQuery<PartyFieldsFragment[]>({
    queryKey: [QUERY_KEYS.PARTIES],
    queryFn: async () => {
      const response = await graphQLSDK.parties();
      return normalizeFlattenParties(response.parties);
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: 2,
    retryDelay: 500,
  });

  const partyGraph = useMemo<PartyGraph>(() => {
    if (!data) return { parties: [], partyByUrn: new Map(), partyByUuid: new Map(), currentEndUser: undefined };
    return buildPartyGraph(data);
  }, [data]);

  const handleSetSelectedParties = (parties: PartyFieldsFragment[] | null) => {
    if (parties?.length) {
      setSelectedParties(parties);
    }
  };

  const setSelectedPartyIds = (partyIds: string[], allOrgSelected: boolean) => {
    setAllOrganizationsSelected(allOrgSelected);
    const partyIsPerson = partyIds.some((partyId) => partyId.includes('person')) || isSelfIdentifiedUser;
    const searchParamsString = searchParams.toString();

    if (allOrgSelected) {
      const allPartiesParams = createPartyParams(searchParamsString, FixedGlobalQueryParams.allParties, 'true');
      handleChangSearchParams(allPartiesParams);
    } else if (partyIsPerson) {
      /* We need to exclude person from URL because it contains information we don't want to expose in the URL.
       * However, if current end user has multiple parties of type person, we need to resolve to current end (user logged in)
       * user party from URL.
       */
      const personParams = new URLSearchParams(stripQueryParamsForPersonParty(searchParamsString));
      handleChangSearchParams(personParams);
    } else {
      const params = createPartyParams(searchParamsString, FixedGlobalQueryParams.party, partyIds[0]);
      handleChangSearchParams(params);
    }

    const matchedParties = data?.filter((party) => partyIds.includes(party.party)) ?? [];
    handleSetSelectedParties(matchedParties);

    const selectedParty = matchedParties[0];
    if (selectedParty?.partyUuid) {
      updatePartyCookies({
        partyUuid: selectedParty.partyUuid,
        partyId: selectedParty.partyId,
      });
    }
  };

  const selectAllOrganizations = () => {
    const allOrgParties =
      data?.filter((party) => party.party.includes('organization')).map((party) => party.party) ?? [];
    setSelectedPartyIds(allOrgParties, true);
  };

  const getPartyFromURL = () => {
    const partyFromQuery = getSelectedPartyFromQueryParams(searchParams);
    if (partyFromQuery) {
      return data?.find((party) => party.party === partyFromQuery);
    }

    return undefined;
  };

  const currentEndUser = useMemo(() => data?.find((party) => party.isCurrentEndUser), [data]);

  const initializePartySelection = () => {
    // Synchronous guard — prevents multiple hook instances from initializing
    if (queryClient.getQueryData(['hasInitializedPartySelection'])) {
      return;
    }
    queryClient.setQueryData(['hasInitializedPartySelection'], true);

    if (getSelectedAllPartiesFromQueryParams(searchParams)) {
      selectAllOrganizations();
    } else {
      const partyFromQuery = getSelectedPartyFromQueryParams(searchParams);
      const partyFromCookie = cookiePartyUuid ? data?.find((party) => party.partyUuid === cookiePartyUuid) : undefined;

      if (partyFromQuery) {
        // URL takes highest precedence
        const orgFromURL = getPartyFromURL();
        if (orgFromURL) {
          setSelectedPartyIds([orgFromURL.party], false);
        }
      } else if (partyFromCookie) {
        // Cookie takes precedence over default
        setSelectedPartyIds([partyFromCookie.party], false);
      } else if (currentEndUser) {
        // Fallback to logged-in user
        setSelectedPartyIds([currentEndUser.party], false);
      } else {
        console.warn('No current end user found, unable to select default parties.');
      }
    }
  };

  const isCompanyFromParams = useMemo(() => {
    const party = searchParams.get('party');
    const allParties = searchParams.get('allParties');
    return Boolean(party || allParties);
  }, [searchParams]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    if (isSuccess) {
      if (data?.length > 0) {
        initializePartySelection();
        if (data?.length === 1 && data[0].partyType === 'SelfIdentified') {
          setIsSelfIdentifiedUser(true);
        }
      } else {
        setPartiesEmptyList(true);
        setIsSelfIdentifiedUser(true);
      }
    }
  }, [isSuccess, data]);

  // Handle URL-driven account switching (after initialization)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only react to searchParams changes
  useEffect(() => {
    if (!isSuccess || !data?.length || !queryClient.getQueryData(['hasInitializedPartySelection'])) {
      return;
    }

    // Read actual current URL to avoid acting on stale searchParams from closure
    const currentParams = new URLSearchParams(window.location.search);
    const allPartiesParam = currentParams.get(FixedGlobalQueryParams.allParties) === 'true';
    const partyParam = currentParams.get(FixedGlobalQueryParams.party);

    if (allPartiesParam) {
      selectAllOrganizations();
    } else if (partyParam) {
      const party = data?.find((p) => p.party === partyParam);
      if (party) {
        setSelectedPartyIds([party.party], false);
      }
    }
  }, [searchParams]);

  const isCompanyProfile =
    isCompanyFromParams || allOrganizationsSelected || selectedParties?.[0]?.partyType === 'Organization';

  const selectedProfile: ProfileType = allOrganizationsSelected ? 'neutral' : isCompanyProfile ? 'company' : 'person';

  const currentPartyUuid = useMemo(() => {
    return allOrganizationsSelected ? currentEndUser?.partyUuid : selectedParties[0]?.partyUuid;
  }, [selectedParties, currentEndUser, allOrganizationsSelected]);

  return {
    isLoading,
    isSuccess,
    isError,
    selectedParties,
    selectedPartyIds: selectedParties.map((party) => party.party) ?? [],
    setSelectedParties: handleSetSelectedParties,
    setSelectedPartyIds,
    partyGraph,
    currentEndUser,
    allOrganizationsSelected,
    selectedProfile,
    partiesEmptyList,
    currentPartyUuid,
    isSelfIdentifiedUser,
    organizationLimitReached: selectedParties.length > MAX_DIALOG_PARTY_SIZE,
  };
};
