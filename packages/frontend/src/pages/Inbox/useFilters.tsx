import type { ToolbarFilterProps } from '@altinn/altinn-components';
import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { InboxItemInput } from '../../components';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import { createFiltersURLQuery, getFacets, readFiltersFromURLQuery } from './filters.ts';

interface UseFiltersOutput {
  filterState: FilterState;
  filters: ToolbarFilterProps[];
  onFiltersChange: (filters: FilterState) => void;
}

interface UseFiltersProps {
  dialogs: InboxItemInput[];
}

export const useFilters = ({ dialogs }: UseFiltersProps): UseFiltersOutput => {
  const [_, setSearchParams] = useSearchParams();
  const [filterState, setFilterState] = useState<FilterState>(readFiltersFromURLQuery(location.search));
  const format = useFormat();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const filters = useMemo(() => {
    const facets = getFacets(dialogs, filterState, format);
    const legalFilterKeys = facets.map((setting) => setting.id);
    const unwantedFilters = Object.keys(filterState).some((filter) => !legalFilterKeys.includes(filter));

    if (unwantedFilters) {
      /* Prune filter state*/
      const newFilterState = Object.keys(filterState)
        .filter((key) => legalFilterKeys.includes(key))
        .reduce((obj, key) => {
          obj[key] = filterState[key];
          return obj;
        }, {} as FilterState);
      setFilterState(newFilterState);
    }

    return facets;
  }, [dialogs, filterState]);

  const onFiltersChange = (filters: FilterState) => {
    const currentURL = new URL(window.location.href);
    const filterKeys = Object.keys(filters);
    const updatedURL = createFiltersURLQuery(filters, filterKeys, currentURL.toString());
    setSearchParams(updatedURL.searchParams, { replace: true });
    setFilterState(filters);
  };

  return { filterState: filterState || {}, filters, onFiltersChange };
};
