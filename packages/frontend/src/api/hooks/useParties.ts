import { useQueryClient } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { consumePartyBeforeRedirect } from '../../auth';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { updatePartyCookies } from '../../cookie.ts';
import {
  FixedGlobalQueryParams,
  getSelectedAllPartiesFromQueryParams,
  getSelectedPartyFromQueryParams,
} from '../../pages/Inbox/queryParams.ts';
import { useGlobalState } from '../../useGlobalState.ts';
import { normalizeFlattenParties } from '../../utils/normalizeFlattenParties.ts';
import { EMPTY_PARTY_GRAPH, type PartyGraph, buildPartyGraph } from '../../utils/partyGraph.ts';
import { graphQLSDK } from '../queries.ts';
import { MAX_DIALOG_PARTY_SIZE } from './useDialogs.tsx';

export type ProfileType = 'company' | 'person' | 'neutral';
export type SelfIdentifiedUserType = 'None' | 'Email' | 'Legacy';

interface UsePartiesOutput {
  parties: PartyFieldsFragment[];
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
  partyGraph: PartyGraph;
  currentPartyUuid: string | undefined;
  isSelfIdentifiedUser: boolean;
  selfIdentifiedUserType: SelfIdentifiedUserType;
  organizationLimitReached: boolean;
}

const stripQueryParamsForPersonParty = (searchParamString: string) => {
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

    const matchedParties: PartyFieldsFragment[] = [];
    for (const id of partyIds) {
      const p = partyGraph.partyByUrn.get(id);
      if (p) matchedParties.push(p);
    }
    handleSetSelectedParties(matchedParties);

    const partyForCookie = allOrgSelected ? currentEndUser : matchedParties[0];
    if (partyForCookie?.partyUuid) {
      updatePartyCookies({
        partyUuid: partyForCookie.partyUuid,
        partyId: partyForCookie.partyId,
      });
    }
  };

  const selectAllOrganizations = () => {
    const allOrgParties: string[] = [];
    for (const [urn] of partyGraph.partyByUrn) {
      if (urn.includes('organization')) {
        allOrgParties.push(urn);
      }
    }
    setSelectedPartyIds(allOrgParties, true);
  };

  const currentEndUser = useMemo(() => data?.find((party) => party.isCurrentEndUser), [data]);

  const partyGraph = useMemo(() => {
    if (!data) return EMPTY_PARTY_GRAPH;
    return buildPartyGraph(data);
  }, [data]);

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
      // URL takes highest precedence
      const orgFromURL = partyFromQuery ? partyGraph.partyByUrn.get(partyFromQuery) : undefined;

      // Restore the party the user had selected before a re-login redirect.
      // The OIDC provider overwrites AltinnPartyUuid with the preselected actor
      // during re-authentication, so this saved value takes precedence over the cookie.
      // The end user UUID is verified to prevent cross-user contamination on shared computers.
      const savedEntry = consumePartyBeforeRedirect();
      const savedParty = savedEntry ? partyGraph.partyByUuid.get(savedEntry.partyUuid) : undefined;
      const partyFromCookie = cookiePartyUuid ? partyGraph.partyByUuid.get(cookiePartyUuid) : undefined;

      if (partyFromQuery && orgFromURL) {
        setSelectedPartyIds([orgFromURL.party], false);
      } else if (partyFromCookie && !savedParty) {
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

  // Derive a stable key from only party-related query params to avoid reacting to unrelated URL changes
  const partyParamKey = `${searchParams.get(FixedGlobalQueryParams.party) ?? ''}|${searchParams.get(FixedGlobalQueryParams.allParties) ?? ''}`;

  // Handle URL-driven account switching (after initialization)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only react to party-related param changes
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
      const party = partyGraph.partyByUrn.get(partyParam);
      if (party) {
        setSelectedPartyIds([party.party], false);
      }
    }
  }, [partyParamKey]);

  const isCompanyProfile =
    isCompanyFromParams || allOrganizationsSelected || selectedParties?.[0]?.partyType === 'Organization';

  const selectedProfile: ProfileType = allOrganizationsSelected ? 'neutral' : isCompanyProfile ? 'company' : 'person';

  const currentPartyUuid = useMemo(() => {
    return allOrganizationsSelected ? currentEndUser?.partyUuid : selectedParties[0]?.partyUuid;
  }, [selectedParties, currentEndUser, allOrganizationsSelected]);

  const selfIdentifiedUserType: SelfIdentifiedUserType = useMemo(() => {
    if (!currentEndUser || currentEndUser.partyType !== 'SelfIdentified') return 'None';

    if (currentEndUser.party.includes('urn:altinn:person:idporten-email:')) return 'Email';
    if (currentEndUser.party.includes('urn:altinn:person:legacy-selfidentified:')) return 'Legacy';

    return 'None';
  }, [currentEndUser]);

  const selectedPartyIds = useMemo(() => selectedParties.map((party) => party.party), [selectedParties]);

  return {
    isLoading,
    isSuccess,
    isError,
    partyGraph,
    selectedParties,
    selectedPartyIds,
    setSelectedParties: handleSetSelectedParties,
    setSelectedPartyIds,
    parties: data ?? [],
    currentEndUser,
    allOrganizationsSelected,
    selectedProfile,
    partiesEmptyList,
    currentPartyUuid,
    isSelfIdentifiedUser,
    organizationLimitReached: selectedParties.length > MAX_DIALOG_PARTY_SIZE,
    selfIdentifiedUserType,
  };
};
