import type { ToolbarFilterProps, ToolbarProps } from '@altinn/altinn-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useDialogsCount } from '../../api/hooks/useDialogsCount.tsx';
import { getOrganization } from '../../api/utils/organizations.ts';
import { FilterCategory, getFilters, readFiltersFromURLQuery } from './filters.ts';
import { useOrganizations } from './useOrganizations.ts';

interface UseFiltersOutput {
  filters: ToolbarFilterProps[];
  getFilterLabel: ToolbarProps['getFilterLabel'];
}

interface UseFiltersProps {
  viewType: InboxViewType;
}

export const useFilters = ({ viewType }: UseFiltersProps): UseFiltersOutput => {
  const { t } = useTranslation();
  const { dialogCounts: allDialogs } = useDialogsCount();
  const { organizations } = useOrganizations();

  const [params] = useSearchParams();
  const orgsFromSearchState = params.getAll('org');

  const currentFilters = useMemo(() => {
    const filters = readFiltersFromURLQuery(params.toString());
    const normalizedFilters: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        normalizedFilters[key] = value.map(String);
      } else if (typeof value === 'string') {
        normalizedFilters[key] = [value];
      }
    }

    if (normalizedFilters.updated && normalizedFilters.updated.length > 0) {
      normalizedFilters.updated = [normalizedFilters.updated[0]];
    }

    return normalizedFilters;
  }, [params]);

  const filters = useMemo(
    () =>
      getFilters({
        allDialogs,
        allOrganizations: organizations,
        viewType,
        orgsFromSearchState,
        currentFilters,
      }),
    [allDialogs, organizations, viewType, orgsFromSearchState, currentFilters],
  );

  const getFilterLabel = (name: string, value: (string | number)[] | undefined) => {
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

    if (name === FilterCategory.ORG) {
      if (value?.length === 1) {
        const serviceOwner = getOrganization(organizations, String(value[0]), 'nb');
        return serviceOwner?.name || '';
      }
      return t('inbox.filter.multiple.sender', { count: value?.length });
    }
    return '';
  };

  return { filters, getFilterLabel };
};
