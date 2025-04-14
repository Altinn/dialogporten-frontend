import { useQuery } from '@tanstack/react-query';
import type { DialogStatus, GetAllDialogsForPartiesQuery, PartyFieldsFragment } from 'bff-types-generated';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { searchDialogs } from '../../../api/queries.ts';
import { mapDialogToToInboxItems } from '../../../api/utils/dialog.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import type { InboxItemInput } from '../../../pages/Inbox/InboxItemInput.ts';
import { useOrganizations } from '../../../pages/Inbox/useOrganizations.ts';

interface searchDialogsProps {
  parties: PartyFieldsFragment[];
  searchValue?: string;
  status?: DialogStatus;
}
interface UseSearchDialogsOutput {
  isLoading: boolean;
  isSuccess: boolean;
  searchResults: InboxItemInput[];
  isFetching: boolean;
}

export const useSearchDialogs = ({ parties, searchValue }: searchDialogsProps): UseSearchDialogsOutput => {
  const { organizations } = useOrganizations();
  const partyURIs = parties.map((party) => party.party);
  const debouncedSearchString = useDebounce(searchValue, 300)[0];
  const [searchParams] = useSearchParams();
  const searchBarParam = new URLSearchParams(searchParams);
  const org = searchBarParam.get('org') ?? '';
  const enabled = parties.length > 0 && ((!!debouncedSearchString && debouncedSearchString.length > 2) || !!org);

  const { data, isSuccess, isLoading, isFetching } = useQuery<GetAllDialogsForPartiesQuery>({
    queryKey: [QUERY_KEYS.SEARCH_DIALOGS, partyURIs, debouncedSearchString, org],
    queryFn: () => searchDialogs(partyURIs, debouncedSearchString, org),
    staleTime: 1000 * 60 * 10,
    enabled,
  });

  const [searchResults, setSearchResults] = useState([] as InboxItemInput[]);

  useEffect(() => {
    setSearchResults(enabled ? mapDialogToToInboxItems(data?.searchDialogs?.items ?? [], parties, organizations) : []);
  }, [data?.searchDialogs?.items, enabled, parties, organizations]);

  return {
    isLoading,
    isSuccess,
    searchResults,
    isFetching,
  };
};
