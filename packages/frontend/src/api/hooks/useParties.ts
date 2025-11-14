import type { PartyFieldsFragment } from 'bff-types-generated';
import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';
import {
  getSelectedAllPartiesFromQueryParams,
  getSelectedPartyFromQueryParams,
} from '../../pages/Inbox/queryParams.ts';
import { useGlobalState } from '../../useGlobalState.ts';
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

const getPartyUuidFromCookie = (): string | undefined => {
  if (typeof document === 'undefined') return undefined;

  const cookies = document.cookie.split(';');
  let partyUuid: string | undefined;

  for (const cookie of cookies) {
    const [rawKey, ...rawValParts] = cookie.split('=');
    const key = rawKey.trim();
    const value = rawValParts.join('=').trim();

    if (key === 'AltinnPartyUuid') {
      partyUuid = value;
      break;
    }
  }

  return partyUuid;
};

export const useParties = (): UsePartiesOutput => {
  const location = useLocation();
  const stopReversingPersonNameOrder = useFeatureFlag<boolean>('party.stopReversingPersonNameOrder');
  const [searchParams, setSearchParams] = useSearchParams();
  const [allOrganizationsSelected, setAllOrganizationsSelected] = useGlobalState<boolean>(
    QUERY_KEYS.ALL_ORGANIZATIONS_SELECTED,
    false,
  );
  const [selectedParties, setSelectedParties] = useGlobalState<PartyFieldsFragment[]>(QUERY_KEYS.SELECTED_PARTIES, []);
  const [partiesEmptyList, setPartiesEmptyList] = useGlobalState<boolean>(QUERY_KEYS.PARTIES_EMPTY_LIST, false);
  const cookiePartyUuidRef = useRef<string | undefined>(undefined);
  const hasInitializedFromCookieRef = useRef(false);

  useEffect(() => {
    cookiePartyUuidRef.current = getPartyUuidFromCookie();
  }, []);

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
      return normalizeFlattenParties(response.parties, stopReversingPersonNameOrder);
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
    const partyIsPerson = partyIds.some((partyId) => partyId.includes('person'));
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

  const getPartyFromURLOrCookie = () => {
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
      return;
    }

    // Cookie override – applied only once
    if (!hasInitializedFromCookieRef.current && cookiePartyUuidRef.current && data?.length) {
      const partyFromCookie = data.find((party) => party.partyUuid === cookiePartyUuidRef.current);

      if (partyFromCookie) {
        hasInitializedFromCookieRef.current = true;
        setSelectedPartyIds([partyFromCookie.party], false);
        return;
      }

      hasInitializedFromCookieRef.current = true;
    }

    const orgFromURL = getPartyFromURLOrCookie();
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
      setSelectedPartyIds([currentEndUser.party], false);
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
      } else {
        setPartiesEmptyList(true);
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

  const currentEndUser = useMemo(() => {
    return data?.find((party) => party.isCurrentEndUser);
  }, [data]);

  const currentPartyUuid = useMemo(() => {
    return allOrganizationsSelected ? currentEndUser?.partyUuid : selectedParties[0]?.partyUuid;
  }, [selectedParties, currentEndUser, allOrganizationsSelected]);

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
  };
};
