import type { AutocompleteItemProps, AutocompleteProps } from '@altinn/altinn-components';
import { useQuery } from '@tanstack/react-query';
import type { DialogStatus, GetSearchAutocompleteDialogsQuery, PartyFieldsFragment } from 'bff-types-generated';
import { t } from 'i18next';
import { useMemo } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useDialogsCount } from '../../../api/hooks/useDialogsCount.tsx';
import { searchAutocompleteDialogs } from '../../../api/queries.ts';
import {
  type SearchAutocompleteDialogInput,
  mapAutocompleteDialogsDtoToInboxItem,
} from '../../../api/utils/autcomplete.ts';
import { getPartyIds } from '../../../api/utils/dialog.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { pruneSearchQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { useOrganizations } from '../../../pages/Inbox/useOrganizations.ts';
import { createSendersForAutocomplete } from './senderSuggestions.tsx';

interface searchDialogsProps {
  selectedParties: PartyFieldsFragment[];
  searchValue?: string;
  status?: DialogStatus;
}

const getSkeletonItems = (size: number) => {
  return Array.from({ length: size }, (_, index) => {
    const randomTitle = Math.random()
      .toString(2)
      .substring(2, 9 + Math.floor(Math.random() * 7));
    const randomDescription = Math.random()
      .toString(2)
      .substring(2, 10 + Math.floor(Math.random() * 21));
    return {
      id: `loading-${index + 1}`,
      title: randomTitle,
      description: randomDescription,
      loading: true,
      groupId: 'searching',
      disabled: false,
    };
  });
};

const createAutocomplete = (
  searchResults: SearchAutocompleteDialogInput[],
  isLoading: boolean,
  searchValue?: string,
): AutocompleteProps => {
  const resultsSize = 5;
  const isSearchAllowed = (searchValue?.length ?? 0) > 2;

  const getScopeItem = (label: React.ReactNode, badgeLabel?: string) => ({
    id: 'inboxScope',
    type: 'scope',
    groupId: 'all-scopes-1',
    ariaLabel: t('search.autocomplete.searchInInbox', { query: searchValue }),
    as: (props: AutocompleteItemProps) => (
      <Link
        {...(props as LinkProps)}
        to={`/${pruneSearchQueryParams(location.search, { search: isSearchAllowed ? (searchValue as string) : undefined })}`}
      />
    ),
    badge: badgeLabel ? { label: badgeLabel } : undefined,
    label,
  });

  const mapSearchResults = (query: string) =>
    searchResults.slice(0, resultsSize).map((item) => ({
      id: item.id,
      groupId: 'searchResults',
      // @ts-ignore
      as: (props: AutocompleteItemProps) => <Link to={`/inbox/${item.id}${location.search}`} {...props} />,
      title: item.title,
      description: item.summary,
      tabIndex: -1,
      type: 'dialog',
      ...(query ? { highlightWords: [query] } : {}),
    }));

  if (!isSearchAllowed) {
    return {
      items: [getScopeItem(`${t('word.everything')} ${t('search.autocomplete.inInbox')}`)],
    } as AutocompleteProps;
  }

  const searchResult = mapSearchResults(searchValue ?? '');
  const suggestions = isLoading ? getSkeletonItems(resultsSize) : searchResult;

  return {
    items: [
      getScopeItem(
        <span>
          <mark>{searchValue}</mark> {t('search.autocomplete.inInbox')}
        </span>,
        t('search.hits', { count: searchResults.length }),
      ),
      ...suggestions,
    ],
    groups: { searchResults: { title: t('search.autocomplete.recommendedHits') } },
  } as AutocompleteProps;
};

interface UseAutocompleteDialogsOutput {
  isLoading: boolean;
  isSuccess: boolean;
  autocompleteResults?: SearchAutocompleteDialogInput[];
  autocomplete: AutocompleteProps;
  isFetching: boolean;
}

export const useAutocomplete = ({ selectedParties, searchValue }: searchDialogsProps): UseAutocompleteDialogsOutput => {
  const partyURIs = getPartyIds(selectedParties);
  const debouncedSearchString = useDebounce(searchValue, 300)[0];
  const { dialogCounts: allDialogs } = useDialogsCount();
  const { organizations } = useOrganizations();
  const enabled = !!debouncedSearchString && debouncedSearchString.length > 2 && selectedParties.length > 0;
  const {
    data: hits,
    isSuccess,
    isLoading,
    isFetching,
  } = useQuery<GetSearchAutocompleteDialogsQuery>({
    queryKey: [QUERY_KEYS.SEARCH_AUTOCOMPLETE_DIALOGS, partyURIs, debouncedSearchString],
    queryFn: () => searchAutocompleteDialogs(partyURIs, debouncedSearchString),
    staleTime: 1000 * 60 * 10,
    enabled,
    gcTime: 0,
  });

  const suggestedSenders = createSendersForAutocomplete(searchValue ?? '', allDialogs, organizations);

  const autocomplete: AutocompleteProps = useMemo(() => {
    const results = hits?.searchDialogs?.items ?? [];
    const items = mapAutocompleteDialogsDtoToInboxItem(results);
    return createAutocomplete(items, isLoading, searchValue);
  }, [hits, isLoading, searchValue]);

  const mergedAutocomplete = {
    groups: {
      ...suggestedSenders.groups,
      ...autocomplete.groups,
      searching: { title: t('search.autocomplete.loadingText', { query: searchValue }) },
    },
    items: [...suggestedSenders.items, ...autocomplete.items].sort((a, b) =>
      (a.groupId ?? '').toString().localeCompare((b.groupId ?? '').toString()),
    ),
  };

  return {
    isLoading,
    isSuccess,
    autocomplete: mergedAutocomplete,
    isFetching,
  };
};
