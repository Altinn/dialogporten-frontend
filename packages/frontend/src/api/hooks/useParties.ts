import type { PartyFieldsFragment } from 'bff-types-generated';
import { useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { getCookieDomain } from '../../auth';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { type PartyCookieName, getPartyFromCookie } from '../../cookie.ts';
import {
  getSelectedAllPartiesFromQueryParams,
  getSelectedPartyFromQueryParams,
} from '../../pages/Inbox/queryParams.ts';
import { useGlobalState, useGlobalStringState } from '../../useGlobalState.ts';
import { graphQLSDK } from '../queries.ts';
import { normalizeFlattenParties } from '../utils/normalizeFlattenParties.ts';

export type ProfileType = 'company' | 'person' | 'neutral';

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
  flattenedParties: FlattenedParty[];
  currentPartyUuid: string | undefined;
  isSelfIdentifiedUser: boolean;
  organizationLimitReached: boolean;
}

const stripQueryParamsForParty = (searchParamString: string) => {
  const params = new URLSearchParams(searchParamString);
  params.delete('party');
  params.delete('allParties');
  return params.toString();
};

type FlattenedParty = PartyFieldsFragment & {
  parentId?: string;
};

const createPartyParams = (searchParamString: string, key: string, value: string): URLSearchParams => {
  const params = new URLSearchParams(searchParamString);
  params.delete('allParties');
  params.delete('party');
  params.set(key, value);
  return params;
};

export const useParties = (): UsePartiesOutput => {
  const location = useLocation();
  const [cookiePartyUuid] = useGlobalStringState(QUERY_KEYS.ALTINN_COOKIE, '');
  const [hasInitializedFromCookie, setHasInitializedFromCookie] = useGlobalState<boolean>(
    'hasInitializedFromCookie',
    false,
  );
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

  const handleChangSearchParams = (searchParams: URLSearchParams) => {
    /* Avoid setting search params if they are the same as the current ones */
    if (searchParams.toString() !== new URLSearchParams(location.search).toString()) {
      setSearchParams(searchParams, { replace: true });
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
      const allPartiesParams = createPartyParams(searchParamsString, 'allParties', 'true');
      handleChangSearchParams(allPartiesParams);
    } else if (partyIsPerson) {
      /* We need to exclude person from URL because it contains information we don't want to expose in the URL.
       * However, if current end user has multiple parties of type person, we need to resolve to current end (user logged in)
       * user party from URL.
       */
      const personParams = new URLSearchParams(stripQueryParamsForParty(searchParamsString));
      handleChangSearchParams(personParams);
    } else {
      const params = createPartyParams(searchParamsString, 'party', encodeURIComponent(partyIds[0]));
      handleChangSearchParams(params);
    }

    handleSetSelectedParties(data?.filter((party) => partyIds.includes(party.party)) ?? []);
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

  const getEndUserParty = () => {
    return data?.find((party) => party.isCurrentEndUser);
  };

  const initializePartySelection = () => {
    if (getSelectedAllPartiesFromQueryParams(searchParams)) {
      selectAllOrganizations();
      setHasInitializedFromCookie(true);
      return;
    }

    const partyFromCookie = data?.find((party) => party.partyUuid === cookiePartyUuid);

    // Cookie override – applied only once
    if (!hasInitializedFromCookie && cookiePartyUuid && data?.length) {
      if (partyFromCookie) {
        const partyFromQuery = getSelectedPartyFromQueryParams(searchParams);
        if (!partyFromQuery) {
          setSelectedPartyIds([partyFromCookie.party], false);
        }
      }
      setHasInitializedFromCookie(true);
    }

    const orgFromURL = getPartyFromURL();
    const currentEndUser = getEndUserParty();
    const selectedPartyIsPerson = selectedParties.some((party) => party.party.includes('person'));

    if (orgFromURL) {
      setSelectedPartyIds([orgFromURL.party], false);
    } else if (selectedPartyIsPerson) {
      setSelectedPartyIds(
        selectedParties.map((party) => party.party),
        false,
      );
    } else if (currentEndUser) {
      if (cookiePartyUuid && partyFromCookie?.party && currentEndUser?.partyUuid !== cookiePartyUuid) {
        setSelectedPartyIds([partyFromCookie.party], false);
      } else {
        setSelectedPartyIds([currentEndUser.party], false);
      }
    } else {
      console.warn('No current end user found, unable to select default parties.');
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
        // TODO: Remove this when Dialogporten adds self-identified user to parties response
        setIsSelfIdentifiedUser(true);
      }
    }
  }, [isSuccess, data, location.search]);

  const isCompanyProfile =
    isCompanyFromParams || allOrganizationsSelected || selectedParties?.[0]?.partyType === 'Organization';

  const selectedProfile: ProfileType = allOrganizationsSelected ? 'neutral' : isCompanyProfile ? 'company' : 'person';

  const flattenedParties = useMemo(() => {
    if (!data) return [];
    return data.flatMap((party) => [
      party,
      ...(party.subParties?.map((subParty) => ({
        ...subParty,
        parentId: party.partyUuid,
      })) ?? []),
    ]) as FlattenedParty[];
  }, [data]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const currentEndUser = useMemo(() => {
    return getEndUserParty();
  }, [data]);

  const currentPartyUuid = useMemo(() => {
    return allOrganizationsSelected ? currentEndUser?.partyUuid : selectedParties[0]?.partyUuid;
  }, [selectedParties, currentEndUser, allOrganizationsSelected]);

  const currentA2PartyId = useMemo(() => {
    return allOrganizationsSelected ? currentEndUser?.partyId : selectedParties[0]?.partyId;
  }, [selectedParties, currentEndUser, allOrganizationsSelected]);

  useEffect(() => {
    if (!currentPartyUuid || currentA2PartyId == null) return;

    const domain = getCookieDomain();

    const ensureCookie = (key: PartyCookieName, value: string) => {
      const existing = getPartyFromCookie(key);
      if (existing !== value) {
        document.cookie = `${key}=${value}; Path=/; Domain=${domain}`;
      }
    };

    ensureCookie('AltinnPartyUuid', currentPartyUuid);
    ensureCookie('AltinnPartyId', String(currentA2PartyId));
  }, [currentPartyUuid, currentA2PartyId]);

  return {
    isLoading,
    isSuccess,
    isError,
    flattenedParties,
    selectedParties,
    selectedPartyIds: selectedParties.map((party) => party.party) ?? [],
    setSelectedParties: handleSetSelectedParties,
    setSelectedPartyIds,
    parties: data ?? [],
    currentEndUser,
    allOrganizationsSelected,
    selectedProfile,
    partiesEmptyList,
    currentPartyUuid,
    isSelfIdentifiedUser,
    organizationLimitReached: selectedParties.length > 20,
  };
};
