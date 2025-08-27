import { useQuery } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useEffect, useMemo } from 'react';

type PartiesResult = {
  parties: PartyFieldsFragment[];
};
import { useLocation, useSearchParams } from 'react-router-dom';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import {
  getSelectedAllPartiesFromQueryParams,
  getSelectedPartyFromQueryParams,
} from '../../pages/Inbox/queryParams.ts';
import { useGlobalState } from '../../useGlobalState.ts';
import { graphQLSDK } from '../queries.ts';
import { normalizeFlattenParties } from '../utils/normalizeFlattenParties.ts';

export type SelectedPartyType = 'company' | 'person';

interface UsePartiesOutput {
  parties: PartyFieldsFragment[];
  deletedParties: PartyFieldsFragment[];
  isSuccess: boolean;
  isError: boolean;
  isLoading: boolean;
  selectedParties: PartyFieldsFragment[];
  selectedPartyIds: string[];
  setSelectedParties: (parties: PartyFieldsFragment[]) => void;
  setSelectedPartyIds: (parties: string[], allOrganizationsSelected: boolean) => void;
  currentEndUser: PartyFieldsFragment | undefined;
  allOrganizationsSelected: boolean;
  selectedProfile: SelectedPartyType;
  partiesEmptyList: boolean;
  error?: unknown;
}

const stripQueryParamsForParty = (searchParamString: string) => {
  const params = new URLSearchParams(searchParamString);
  params.delete('party');
  params.delete('allParties');
  return params.toString();
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [allOrganizationsSelected, setAllOrganizationsSelected] = useGlobalState<boolean>(
    QUERY_KEYS.ALL_ORGANIZATIONS_SELECTED,
    false,
  );
  const [selectedParties, setSelectedParties] = useGlobalState<PartyFieldsFragment[]>(QUERY_KEYS.SELECTED_PARTIES, []);
  const [partiesEmptyList, setPartiesEmptyList] = useGlobalState<boolean>(QUERY_KEYS.PARTIES_EMPTY_LIST, false);

  const handleChangSearchParams = (searchParams: URLSearchParams) => {
    /* Avoid setting search params if they are the same as the current ones */
    if (searchParams.toString() !== new URLSearchParams(location.search).toString()) {
      setSearchParams(searchParams, { replace: true });
    }
  };

  const { data, isLoading, isSuccess, isError, error } = useQuery<PartiesResult>({
    queryKey: [QUERY_KEYS.PARTIES],
    queryFn: async () => {
      const res = await graphQLSDK.parties();
      return { parties: res.parties };
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    retry: 2,
    retryDelay: 500,
  });

  const normalizedParties = normalizeFlattenParties(data?.parties ?? []);
  const parties = normalizedParties.filter((party) => !party.isDeleted);
  const deletedParties = normalizedParties.filter((party) => party.isDeleted);

  const handleSetSelectedParties = (parties: PartyFieldsFragment[] | null) => {
    if (parties?.length) {
      setSelectedParties(parties);
    }
  };

  const setSelectedPartyIds = (partyIds: string[], allOrganizationsSelected: boolean) => {
    setAllOrganizationsSelected(allOrganizationsSelected);
    const partyIsPerson = partyIds.some((partyId) => partyId.includes('person'));
    const searchParamsString = searchParams.toString();
    if (allOrganizationsSelected) {
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
    handleSetSelectedParties(parties.filter((party) => partyIds.includes(party.party)) ?? []);
  };

  const selectAllOrganizations = () => {
    const allOrgParties =
      parties?.filter((party) => party.party.includes('organization')).map((party) => party.party) ?? [];
    setSelectedPartyIds(allOrgParties, true);
  };

  const getPartyFromURL = () => {
    const partyFromQuery = getSelectedPartyFromQueryParams(searchParams);
    if (partyFromQuery) {
      return parties?.find((party) => party.party === partyFromQuery);
    }
  };

  const getEndUserParty = () => {
    return parties?.find((party) => party.isCurrentEndUser);
  };

  const handlePartySelection = () => {
    if (getSelectedAllPartiesFromQueryParams(searchParams)) {
      selectAllOrganizations();
    } else {
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
      if (parties?.length > 0) {
        handlePartySelection();
      } else {
        setPartiesEmptyList(true);
      }
    }
  }, [isSuccess, location.search]);

  const isCompanyProfile =
    isCompanyFromParams || allOrganizationsSelected || selectedParties?.[0]?.partyType === 'Organization';

  const selectedProfile = (isCompanyProfile ? 'company' : 'person') as 'company' | 'person';

  return {
    isLoading,
    isSuccess,
    isError,
    error,
    selectedParties,
    selectedPartyIds: selectedParties.map((party) => party.party) ?? [],
    setSelectedParties: handleSetSelectedParties,
    setSelectedPartyIds,
    parties: parties ?? [],
    currentEndUser: parties.find((party) => party.isCurrentEndUser),
    deletedParties: deletedParties ?? [],
    allOrganizationsSelected,
    selectedProfile,
    partiesEmptyList,
  };
};
