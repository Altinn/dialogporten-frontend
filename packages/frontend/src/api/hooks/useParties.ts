import type { PartyFieldsFragment } from 'bff-types-generated';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { updatePartyCookies } from '../../cookie.ts';
import {
  FixedGlobalQueryParams,
  type PartyGroup,
  PartyGroups,
  getSelectedGroupFromQueryParams,
  getSelectedPartyFromQueryParams,
} from '../../pages/Inbox/queryParams.ts';
import { useProfile } from '../../pages/Profile/useProfile.tsx';
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
  setSelectedPartyIds: (parties: string[], group: PartyGroup | null) => void;
  currentEndUser: PartyFieldsFragment | undefined;
  selectedGroup: PartyGroup | null;
  allOrganizationsSelected: boolean;
  selectedProfile: ProfileType;
  partiesEmptyList: boolean;
  partyGraph: PartyGraph;
  currentPartyUuid: string | undefined;
  isSelfIdentifiedUser: boolean;
  selfIdentifiedUserType: SelfIdentifiedUserType;
  organizationLimitReached: boolean;
}

/** Removes every party/group selection param, leaving unrelated params (filters, search) intact. */
const clearPartySelectionParams = (params: URLSearchParams): URLSearchParams => {
  params.delete(FixedGlobalQueryParams.party);
  params.delete(FixedGlobalQueryParams.allParties);
  params.delete(FixedGlobalQueryParams.group);
  return params;
};

const stripQueryParamsForPersonParty = (searchParamString: string) => {
  const params = clearPartySelectionParams(new URLSearchParams(searchParamString));
  params.delete(FixedGlobalQueryParams.subAccounts);
  return params.toString();
};

const createPartyParams = (searchParamString: string, key: string, value: string): URLSearchParams => {
  const params = clearPartySelectionParams(new URLSearchParams(searchParamString));
  params.set(key, value);
  return params;
};

export const useParties = (): UsePartiesOutput => {
  const [cookiePartyUuid] = useGlobalState(QUERY_KEYS.ALTINN_COOKIE, '');
  const [hasInitializedPartySelection, setHasInitializedPartySelection] = useGlobalState(
    QUERY_KEYS.HAS_INITIALIZED_PARTY_SELECTION,
    false,
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const { shouldShowDeletedEntities } = useProfile();
  const [selectedGroup, setSelectedGroup] = useGlobalState<PartyGroup | null>(QUERY_KEYS.SELECTED_GROUP, null);
  const allOrganizationsSelected = selectedGroup === PartyGroups.ALL_COMPANIES;
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

  const setSelectedPartyIds = (partyIds: string[], group: PartyGroup | null) => {
    setSelectedGroup(group);
    const partyIsPerson = partyIds.some((partyId) => partyId.includes('person')) || isSelfIdentifiedUser;
    const searchParamsString = searchParams.toString();

    if (group) {
      const groupParams = createPartyParams(searchParamsString, FixedGlobalQueryParams.group, group);
      handleChangSearchParams(groupParams);
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

    const partyForCookie = group ? currentEndUser : matchedParties[0];
    if (partyForCookie?.partyUuid) {
      updatePartyCookies({
        partyUuid: partyForCookie.partyUuid,
        partyId: partyForCookie.partyId,
      });
    }
  };

  /** Resolves the (capped-elsewhere) set of party URNs that make up a group. */
  const getGroupPartyIds = (group: PartyGroup): string[] => {
    const ids: string[] = [];
    for (const party of partyGraph.partyByUrn.values()) {
      const belongs =
        group === PartyGroups.ALL_COMPANIES
          ? party.partyType === 'Organization'
          : party.partyType === 'Person' || party.partyType === 'SelfIdentified';
      if (belongs) {
        ids.push(party.party);
      }
    }
    return ids;
  };

  const selectGroup = (group: PartyGroup) => {
    setSelectedPartyIds(getGroupPartyIds(group), group);
  };

  /**
   * Counts the members of a group that the user can actually select given the current settings:
   * companies the user can only reach via sub-parties don't count, and deleted parties only count
   * when "show deleted" is enabled.
   */
  const countSelectableGroupMembers = (group: PartyGroup): number => {
    let count = 0;
    for (const party of partyGraph.partyByUrn.values()) {
      if (group === PartyGroups.ALL_COMPANIES) {
        if (party.partyType !== 'Organization' || party.hasOnlyAccessToSubParties) continue;
      } else if (party.partyType !== 'Person' && party.partyType !== 'SelfIdentified') {
        continue;
      }
      if (!shouldShowDeletedEntities && party.isDeleted) continue;
      count++;
    }
    return count;
  };

  /** A group is only a valid selection when it resolves to at least two selectable members. */
  const isGroupValid = (group: PartyGroup): boolean => countSelectableGroupMembers(group) >= 2;

  /** Resets the selection to the logged-in user, clearing any group/party from the URL. */
  const fallBackToCurrentEndUser = () => {
    if (currentEndUser) {
      setSelectedPartyIds([currentEndUser.party], null);
    }
  };

  const partyGraph = useMemo(() => {
    if (!data) return EMPTY_PARTY_GRAPH;
    return buildPartyGraph(data);
  }, [data]);

  const currentEndUser = partyGraph.currentEndUser;

  const initializePartySelection = () => {
    // Synchronous guard — prevents multiple hook instances from initializing
    if (hasInitializedPartySelection) {
      return;
    }
    setHasInitializedPartySelection(true);

    // A group from the URL is only honored when it's currently a valid selection (enough selectable
    // members given the user's "show deleted" setting). Otherwise we fall through to the default
    // resolution below — gracefully, the same way an invalid party URN is ignored.
    const groupFromQuery = getSelectedGroupFromQueryParams(searchParams);
    if (groupFromQuery && isGroupValid(groupFromQuery)) {
      selectGroup(groupFromQuery);
    } else {
      const partyFromQuery = getSelectedPartyFromQueryParams(searchParams);
      const partyFromCookie = cookiePartyUuid ? partyGraph.partyByUuid.get(cookiePartyUuid) : undefined;
      // URL takes highest precedence
      const orgFromURL = partyFromQuery ? partyGraph.partyByUrn.get(partyFromQuery) : undefined;

      if (partyFromQuery && orgFromURL) {
        setSelectedPartyIds([orgFromURL.party], null);
      } else if (partyFromCookie) {
        // Cookie takes precedence over default
        setSelectedPartyIds([partyFromCookie.party], null);
      } else if (currentEndUser) {
        // Fallback to logged-in user
        setSelectedPartyIds([currentEndUser.party], null);
      } else {
        console.warn('No current end user found, unable to select default parties.');
      }
    }
  };

  const isCompanyFromParams = useMemo(() => {
    return Boolean(searchParams.get(FixedGlobalQueryParams.party));
  }, [searchParams]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    if (isSuccess) {
      if (data?.length > 0) {
        initializePartySelection();
        if (currentEndUser?.partyType === 'SelfIdentified') {
          setIsSelfIdentifiedUser(true);
        }
      } else {
        setPartiesEmptyList(true);
        setIsSelfIdentifiedUser(true);
      }
    }
  }, [isSuccess, data]);

  // Derive a stable key from only party-related query params to avoid reacting to unrelated URL changes
  const partyParamKey = `${searchParams.get(FixedGlobalQueryParams.party) ?? ''}|${searchParams.get(FixedGlobalQueryParams.allParties) ?? ''}|${searchParams.get(FixedGlobalQueryParams.group) ?? ''}`;

  // Handle URL-driven account switching (after initialization)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only react to party-related param changes
  useEffect(() => {
    if (!isSuccess || !data?.length || !hasInitializedPartySelection) {
      return;
    }

    // Read actual current URL to avoid acting on stale searchParams from closure
    const currentParams = new URLSearchParams(window.location.search);
    const groupParam = getSelectedGroupFromQueryParams(currentParams);
    const partyParam = currentParams.get(FixedGlobalQueryParams.party);

    if (groupParam) {
      if (isGroupValid(groupParam)) {
        selectGroup(groupParam);
      } else {
        fallBackToCurrentEndUser();
      }
    } else if (partyParam) {
      const party = partyGraph.partyByUrn.get(partyParam);
      if (party) {
        setSelectedPartyIds([party.party], null);
      }
    }
  }, [partyParamKey]);

  // Re-validate the active group when the "show deleted" setting changes. Hiding deleted parties can
  // turn a previously valid "all companies"/"all persons" selection into an invalid one (e.g. only a
  // single non-deleted company remains); in that case fall back to the logged-in user.
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only react to setting / group changes
  useEffect(() => {
    if (!isSuccess || !data?.length || !hasInitializedPartySelection) {
      return;
    }
    if (selectedGroup && !isGroupValid(selectedGroup)) {
      fallBackToCurrentEndUser();
    }
  }, [shouldShowDeletedEntities, selectedGroup]);

  const isCompanyProfile =
    isCompanyFromParams || allOrganizationsSelected || selectedParties?.[0]?.partyType === 'Organization';

  const selectedProfile: ProfileType = selectedGroup ? 'neutral' : isCompanyProfile ? 'company' : 'person';

  const currentPartyUuid = useMemo(() => {
    return selectedGroup ? currentEndUser?.partyUuid : selectedParties[0]?.partyUuid;
  }, [selectedParties, currentEndUser, selectedGroup]);

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
    selectedGroup,
    allOrganizationsSelected,
    selectedProfile,
    partiesEmptyList,
    currentPartyUuid,
    isSelfIdentifiedUser,
    organizationLimitReached: selectedParties.length > MAX_DIALOG_PARTY_SIZE,
    selfIdentifiedUserType,
  };
};
