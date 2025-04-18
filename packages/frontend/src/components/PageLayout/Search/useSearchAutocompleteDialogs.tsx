import type { AutocompleteItemProps, AutocompleteProps } from '@altinn/altinn-components';
import { useQuery } from '@tanstack/react-query';
import type {
  DialogStatus,
  GetSearchAutocompleteDialogsQuery,
  OrganizationFieldsFragment,
  PartyFieldsFragment,
} from 'bff-types-generated';
import { t } from 'i18next';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { useDialogs } from '../../../api/hooks/useDialogs.tsx';
import { searchAutocompleteDialogs } from '../../../api/queries.ts';
import {
  type SearchAutocompleteDialogInput,
  mapAutocompleteDialogsDtoToInboxItem,
} from '../../../api/utils/autcomplete.ts';
import { getPartyIds } from '../../../api/utils/dialog.ts';
import { getOrganization } from '../../../api/utils/organizations.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import type { InboxItemInput } from '../../../pages/Inbox/InboxItemInput.ts';
import { useOrganizations } from '../../../pages/Inbox/useOrganizations.ts';
import { useSearchString } from './useSearchString.tsx';

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
      icon: 'inbox',
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
  onSearch?: (searchString: string) => void,
): AutocompleteProps => {
  const skeletonSize = 1;
  const resultsSize = 5;
  const isSearchable = (searchValue?.length ?? 0) > 2;

  const getScopeItem = (label: React.ReactNode, badgeLabel?: string) => ({
    id: 'inboxScope',
    type: 'scope',
    disabled: searchResults.length === 0,
    ariaLabel: t('search.autocomplete.searchInInbox', { query: searchValue }),
    as: 'button',
    onClick: () => {
      onSearch?.(searchValue ?? '');
    },
    badge: badgeLabel ? { label: badgeLabel } : undefined,
    label,
  });

  const getInfoItem = (label: React.ReactNode, badgeLabel?: string) => ({
    id: 'info',
    type: 'info',
    disabled: true,
    interactive: false,
    ariaLabel: t('search.autocomplete.searchInInbox', { query: searchValue }),
    badge: badgeLabel ? { label: badgeLabel } : undefined,
    label,
  });

  const mapSearchResults = () =>
    searchResults.slice(0, resultsSize).map((item) => ({
      id: item.id,
      groupId: 'searchResults',
      // @ts-ignore
      as: (props: AutocompleteItemProps) => <Link to={`/inbox/${item.id}${location.search}`} {...props} />,
      title: item.title,
      description: item.summary,
      tabIndex: -1,
      type: 'dialog',
    }));

  if (isLoading) {
    return {
      items: [
        getScopeItem(`${t('word.everything')} ${t('search.autocomplete.inInbox')}`),
        ...getSkeletonItems(skeletonSize),
      ],
      groups: { searching: { title: `${t('search.searchFor')} «${searchValue}»...` } },
    } as AutocompleteProps;
  }

  if (!isSearchable) {
    return {
      items: [getScopeItem(`${t('word.everything')} ${t('search.autocomplete.inInbox')}`)],
    } as AutocompleteProps;
  }

  const searchHits = mapSearchResults();

  if (searchHits.length === 0) {
    return {
      items: [
        getInfoItem(
          <span>
            <mark>{searchValue}</mark> {t('search.autocomplete.inInbox')}
          </span>,
          t('search.hits', { count: searchResults.length }),
        ),
      ],
      groups: { noHits: { title: t('search.hits', { count: searchResults.length }) } },
    } as AutocompleteProps;
  }

  return {
    items: [
      getScopeItem(
        <span>
          <mark>{searchValue}</mark> {t('search.autocomplete.inInbox')}
        </span>,
        t('search.hits', { count: searchResults.length }),
      ),
      ...searchHits,
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

export const useSearchAutocompleteDialogs = ({
  selectedParties,
  searchValue,
}: searchDialogsProps): UseAutocompleteDialogsOutput => {
  const partyURIs = getPartyIds(selectedParties);
  const debouncedSearchString = useDebounce(searchValue, 300)[0];
  const { onSearch } = useSearchString();
  const { dialogs } = useDialogs(selectedParties);
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

  const suggestedSenders = createSendersForAutocomplete(searchValue!, dialogs, onSearch, organizations);

  const autocomplete: AutocompleteProps = useMemo(() => {
    const results = hits?.searchDialogs?.items ?? [];
    return createAutocomplete(mapAutocompleteDialogsDtoToInboxItem(results), isLoading, searchValue, onSearch);
  }, [hits, isLoading, searchValue, onSearch]);

  const mergedAutocomplete = {
    groups: { ...autocomplete.groups, ...suggestedSenders.groups },
    items: [...autocomplete.items, ...suggestedSenders.items],
  };

  return {
    isLoading,
    isSuccess,
    autocomplete: mergedAutocomplete,
    isFetching,
  };
};

export const createSendersForAutocomplete = (
  searchValue: string,
  dialogs: InboxItemInput[],
  onSearch?: (searchString: string, sender?: string) => void,
  organizations?: OrganizationFieldsFragment[],
): AutocompleteProps => {
  const SENDERS_GROUP_ID = 'senders';
  const TYPE_SUGGEST = 'suggest';

  if (!searchValue) {
    return {
      items: [],
      groups: {
        noHits: { title: 'noHits' },
      },
    };
  }

  const splittedSearchValue = searchValue.split(/\s+/).filter(Boolean);

  const { items } = splittedSearchValue.reduce(
    (acc, searchString, _, array) => {
      const senderDetected = dialogs.find(
        (dialog) =>
          dialog.org === searchString.toLowerCase() ||
          dialog.sender.name.toLowerCase().includes(searchString.toLowerCase()),
      );

      if (senderDetected) {
        const serviceOwner = getOrganization(organizations || [], senderDetected.org ?? '', 'nb');
        const unmatchedSearchArr = array.filter((s) => s.toLowerCase() !== searchString.toLowerCase());
        const searchQuery = unmatchedSearchArr.join(' ');
        const ariaLabelId = searchQuery
          ? 'search.autocomplete.searchForSender.withQuery'
          : 'search.autocomplete.searchForSender.withoutQuery';
        if (!acc.items.some((existingItem) => existingItem.id === senderDetected.org)) {
          acc.items.push({
            id: senderDetected.org ?? serviceOwner?.name ?? '',
            groupId: SENDERS_GROUP_ID,
            title: senderDetected.sender.name,
            params: [{ type: 'filter', label: serviceOwner?.name }],
            type: TYPE_SUGGEST,
            as: 'button',
            ariaLabel: t(ariaLabelId, {
              sender: senderDetected.sender.name,
              query: searchQuery,
            }),
            interactive: true,
            onClick: () => {
              onSearch?.(searchQuery, senderDetected.org);
            },
          });
        }
      }

      return acc;
    },
    {
      items: [] as AutocompleteItemProps[],
    },
  );

  const mappedSenderWithKeywords = items.map((item) => {
    const filteredSearchValues = splittedSearchValue.filter(
      (searchString) =>
        !item.title!.toLowerCase().includes(searchString.toLowerCase()) &&
        !item.id!.toLowerCase().includes(searchString.toLowerCase()),
    );

    return {
      ...item,
      params: [
        //@ts-ignore Property 'params' does not exist on type 'AutocompleteItemProps'.
        ...item.params,
        ...filteredSearchValues.map((searchString) => ({
          type: 'search',
          label: searchString,
        })),
      ],
    };
  });

  return {
    items: mappedSenderWithKeywords,
    groups: {
      [SENDERS_GROUP_ID]: { title: t('search.suggestions') },
    },
  };
};
