import type { ToolbarFilterProps, ToolbarProps } from '@altinn/altinn-components';
import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { InboxItemInput } from './InboxItemInput.ts';
import { FilterCategory, getFacets } from './filters.ts';

interface UseFiltersOutput {
  filters: ToolbarFilterProps[];
  getFilterLabel: ToolbarProps['getFilterLabel'];
}

interface UseFiltersProps {
  dialogs: InboxItemInput[];
  filterState: FilterState;
}

export const useFilters = ({ dialogs, filterState }: UseFiltersProps): UseFiltersOutput => {
  const { t } = useTranslation();

  const filters = useMemo(() => {
    return getFacets(dialogs, filterState);
  }, [dialogs, filterState]);

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

    if (name === FilterCategory.ORG || name === FilterCategory.RECIPIENT) {
      if (value?.length === 1) {
        return value.join('');
      }
      return t('inbox.filter.multiple.sender', { count: value?.length });
    }
    return '';
  };

  return { filters, getFilterLabel };
};
