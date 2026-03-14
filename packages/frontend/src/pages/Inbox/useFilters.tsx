import type { FilterProps, FilterState } from '@altinn/altinn-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useDialogsForRecommendations } from '../../api/hooks/useDialogsForRecommendations.tsx';
import { useServiceResource } from '../../api/hooks/useServiceResource.ts';
import { getOrganization } from '../../api/utils/organizations.ts';
import { useFeatureFlag } from '../../featureFlags';
import { useDateFnsLocale } from '../../i18n/useDateFnsLocale.tsx';
import { FilterCategory, createServiceFilter, formatDateRange, getFilters, readFiltersFromURLQuery } from './filters';
import { useOrganizations } from './useOrganizations.ts';

interface UseFiltersOutput {
  filters: FilterProps[];
  getFilterLabel: (
    name: string,
    value: (string | number)[] | undefined,
    filterState?: FilterState,
  ) => string | undefined;
}

interface UseFiltersProps {
  viewType: InboxViewType;
}

export const useFilters = ({ viewType }: UseFiltersProps): UseFiltersOutput => {
  const { t } = useTranslation();
  const dialogsForRecommendations = useDialogsForRecommendations();
  const { locale } = useDateFnsLocale();
  const enableServiceFilter = useFeatureFlag<boolean>('filters.enableServiceFilter');
  const { organizations } = useOrganizations();
  const { serviceResources } = useServiceResource();
  const [params] = useSearchParams();

  const currentFilters = useMemo(() => {
    const filters = readFiltersFromURLQuery(params.toString());
    const normalizedFilters: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        normalizedFilters[key] = value.map(String);
      }
    }

    if (normalizedFilters.updated && normalizedFilters.updated.length > 0) {
      normalizedFilters.updated = [normalizedFilters.updated[0]];
    }

    return normalizedFilters;
  }, [params]);

  const serviceFilterValues = currentFilters.service;
  const serviceFilter = useMemo(
    () =>
      enableServiceFilter
        ? createServiceFilter({
            serviceResources,
            currentFilters: { service: serviceFilterValues },
            allOrganizations: organizations,
          })
        : undefined,
    [serviceResources, serviceFilterValues, organizations, enableServiceFilter],
  );

  const filters: FilterProps[] = useMemo(
    () =>
      getFilters({
        allDialogs: dialogsForRecommendations,
        allOrganizations: organizations,
        viewType,
        enableServiceFilter,
        prebuiltServiceFilter: serviceFilter,
      }),
    [dialogsForRecommendations, organizations, viewType, enableServiceFilter, serviceFilter],
  );

  const getFilterLabel = (
    name: string,
    value: (string | number)[] | undefined,
    filterState?: FilterState,
  ): string | undefined => {
    const filter = filters.find((f) => f.name === name);

    if (filter && !value?.length) {
      if (typeof filter.title === 'string' || typeof filter.label === 'string') {
        return filter.title;
      }
    }

    if (!filter || !value?.length) {
      return undefined;
    }

    if (name === FilterCategory.STATUS) {
      if (value?.length > 2) {
        return t('inbox.filter.multiple.status', { count: value?.length });
      }
      return value.map((v) => t(`status.${v.toString().toLowerCase()}`)).join(', ');
    }

    if (name === FilterCategory.UPDATED) {
      if (value[0] === 'fromAndToDate') {
        const dateDate = formatDateRange(filterState?.fromDate?.[0], filterState?.toDate?.[0], locale);
        if (dateDate) {
          return dateDate;
        }
      }

      return value.map((v) => t(`filter.date.${v.toString().toLowerCase()}`)).join(', ');
    }

    if (name === FilterCategory.ORG) {
      if (value?.length === 1) {
        const serviceOwner = getOrganization(organizations, String(value[0]));
        return serviceOwner?.name || '';
      }
      return t('inbox.filter.multiple.sender', { count: value?.length });
    }

    if (name === FilterCategory.SERVICE) {
      if (value?.length === 1) {
        return t('inbox.filter.single.service');
      }
      return t('inbox.filter.multiple.service', { count: value?.length });
    }

    return undefined;
  };

  return { filters, getFilterLabel };
};
