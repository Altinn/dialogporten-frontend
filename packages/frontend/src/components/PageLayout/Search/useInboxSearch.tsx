import { type FilterState, QueryLabel, type ToolbarSearchProps } from '@altinn/altinn-components';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { createFiltersURLQuery } from '../../../auth/url.ts';
import { FilterCategory } from '../../../pages/Inbox/filters.tsx';
import { pruneSearchQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { getSearchLabels, pruneSearchValue } from './getSearchLabels.ts';
import { useSearchString } from './useSearchString.ts';

export const useInboxSearch = (filterState?: FilterState): ToolbarSearchProps => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { searchValue, setSearchValue, onClear } = useSearchString();

  const ignoreCountFor = ['fromDate', 'toDate', 'search'];
  const activeFilters = Object.keys(filterState ?? {})
    .filter((key) => !ignoreCountFor.includes(key))
    .filter((key) => (filterState?.[key]?.length ?? 0) > 0);
  const searchLabel = getSearchLabels(searchValue);

  return {
    id: 'inbox-toolbar-search',
    collapsible: true,
    value: searchValue,
    hideLabel: true,
    label: t('inbox.search.label'),
    onClear,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value === '') {
        onClear();
      } else {
        setSearchValue(value);
      }
    },
    name: t('word.search'),
    placeholder: t('inbox.search.placeholder'),
    minLength: 3,
    menu: {
      groups: {
        suggestions: {
          title: '',
        },
      },
      items: [
        {
          groupId: 'suggestions',
          title: searchValue,
          label: <QueryLabel params={searchLabel} />,
          'aria-label': t('search.autocomplete.searchInInbox', { query: searchValue }),
          onClick: () => {
            const prunedSearchQuery = pruneSearchValue(searchValue);
            navigate(`${location.pathname}${pruneSearchQueryParams(location.search, { search: prunedSearchQuery })}`);
          },
          as: 'button',
          linkIcon: true,
        },
        {
          groupId: 'suggestions',
          title: searchValue,
          'aria-label': t('search.autocomplete.searchInInbox_with_filters', {
            query: searchValue,
            count: activeFilters.length,
          }),
          hidden: activeFilters.length === 0,
          label: (
            <QueryLabel
              params={[
                ...searchLabel,
                {
                  type: 'filter',
                  value: 'filters',
                  label: t('search.autoComplete.activeFilters', { count: activeFilters.length }),
                },
              ]}
            />
          ),
          onClick: () => {
            const currentURL = new URL(window.location.href);
            const allowedFilters = Object.values(FilterCategory);
            const updatedURL = createFiltersURLQuery(filterState ?? {}, allowedFilters, currentURL.toString());
            const searchParams = new URLSearchParams(updatedURL.searchParams);
            searchParams.set('search', searchValue);
            navigate(`${location.pathname}?${searchParams.toString()}`);
          },
          as: 'button',
          linkIcon: true,
        },
      ],
      onClose: () => {},
    },
  };
};
