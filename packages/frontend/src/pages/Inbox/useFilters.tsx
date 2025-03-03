import type { ToolbarFilterProps, ToolbarProps } from '@altinn/altinn-components';
import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { createFiltersURLQuery } from '../../auth';
import type { InboxItemInput } from './InboxItemInput.ts';
import { FilterCategory, getFacets, readFiltersFromURLQuery } from './filters.ts';

interface UseFiltersOutput {
  filterState: FilterState;
  filters: ToolbarFilterProps[];
  onFiltersChange: (filters: FilterState) => void;
  getFilterLabel: ToolbarProps['getFilterLabel'];
}

interface UseFiltersProps {
  dialogs: InboxItemInput[];
}

export const useFilters = ({ dialogs }: UseFiltersProps): UseFiltersOutput => {
  const [_, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [filterState, setFilterState] = useState<FilterState>(readFiltersFromURLQuery(location.search));

  const filters = useMemo(() => {
    return getFacets(dialogs, filterState);
  }, [dialogs, filterState]);

  const onFiltersChange = (filters: FilterState) => {
    const currentURL = new URL(window.location.href);
    const filterKeys = Object.keys(filters);
    const updatedURL = createFiltersURLQuery(filters, filterKeys, currentURL.toString());
    setSearchParams(updatedURL.searchParams, { replace: true });
    setFilterState(filters);
  };

  const getFilterLabel = (name: string, value: ToolbarFilterProps['value']) => {
    const filter = filters.find((f) => f.name === name);
    if (!filter || !value) {
      return '';
    }

    if (name === FilterCategory.STATUS) {
      return value.map((v) => t(`status.${v.toString().toLowerCase()}`)).join(', ');
    }

    if (name === FilterCategory.UPDATED) {
      return value.map((v) => t(`filter.date.${v.toString().toLowerCase()}`)).join(', ');
    }

    if (name === FilterCategory.SENDER || name === FilterCategory.RECEIVER) {
      if (value?.length === 1) {
        return value.join('');
      }
      return t('inbox.filter.multiple.sender', { count: value?.length });
    }
    return '';
  };

  return { filterState: filterState || {}, filters, onFiltersChange, getFilterLabel };
};
