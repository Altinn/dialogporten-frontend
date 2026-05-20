import type { BookmarkSettingsItemProps, QueryItemProps } from '@altinn/altinn-components';
import { DialogStatus, type SavedSearchesFieldsFragment, type ServiceResource, SystemLabel } from 'bff-types-generated';
import type { Locale } from 'date-fns';
import type { TFunction } from 'i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import type { OrganizationLookup } from '../../utils/organizations.ts';
import { getOrganization } from '../../utils/organizations.ts';
import { DateFilterOption, formatDateRange, formatSingleDate } from '../Inbox/filters';
import { decodeSubAccountIds } from '../Inbox/queryParams.ts';
import { PageRoutes } from '../routes.ts';

export const fromPathToViewType = (path: string | null | undefined): InboxViewType | undefined => {
  if (!path) return undefined;
  const entry = Object.entries(PageRoutes).find(([, route]) => route === path);
  return entry ? (entry[0] as InboxViewType) : 'inbox';
};

export const isPlaceholderValue = (value: string | undefined | null): boolean => {
  if (value) {
    const values = [
      ...Object.values(DateFilterOption),
      ...Object.values(DialogStatus),
      ...Object.values(SystemLabel),
    ] as string[];
    return value.toUpperCase() === value && values.includes(value);
  }
  return false;
};

export const buildFilterParams = (
  savedSearch: SavedSearchesFieldsFragment,
  deps: {
    organizations: OrganizationLookup;
    serviceResourceById: Map<string, ServiceResource>;
    locale: Locale;
    t: TFunction;
  },
): QueryItemProps[] => {
  const { organizations, serviceResourceById, locale, t } = deps;
  const filters = savedSearch.data?.filters ?? [];

  const fromDateFilter = filters.find((f) => f?.id === 'fromDate');
  const toDateFilter = filters.find((f) => f?.id === 'toDate');

  // Matches the toolbar filter order in getFilters() in pages/Inbox/filters.tsx.
  const filterOrder: Record<string, number> = {
    subAccounts: 0,
    systemLabel: 1,
    status: 2,
    isContentSeen: 3,
    updated: 4,
    org: 5,
    service: 6,
  };
  const orderOf = (id: string | null | undefined): number => filterOrder[id ?? ''] ?? Number.MAX_SAFE_INTEGER;

  const mapped: { order: number; item: QueryItemProps }[] = filters
    .filter(
      (filter) =>
        filter?.value && !['fromDate', 'toDate'].includes(filter?.id ?? '') && filter?.value !== 'fromAndToDate',
    )
    .map((filter) => {
      const order = orderOf(filter?.id);

      if (filter?.id === 'subAccounts') {
        const subAccountIds = decodeSubAccountIds(filter?.value);
        if (subAccountIds) {
          return {
            order,
            item: { type: 'filter', label: t('parties.labels.units_count', { count: subAccountIds.length }) },
          };
        }
      }

      if (filter?.id === 'org') {
        const orgName = getOrganization(organizations, filter.value ?? '')?.name || filter.value || '';
        return { order, item: { type: 'filter', label: orgName } };
      }

      if (filter?.id === 'service') {
        const service = serviceResourceById.get(filter.value ?? '');
        return { order, item: { type: 'filter', label: service?.title ?? '' } };
      }

      if (filter?.id === 'isContentSeen') {
        return { order, item: { type: 'filter', label: t(`filter.is_content_seen.${filter.value}`) } };
      }

      return {
        order,
        item: {
          type: 'filter',
          label: isPlaceholderValue(filter?.value)
            ? t(`filter.query.${(filter?.value ?? '').toLowerCase()}`)
            : (filter?.value ?? ''),
        },
      };
    });

  const dateLabel = formatDateRange(fromDateFilter?.value ?? undefined, toDateFilter?.value ?? undefined, locale);
  if (dateLabel) {
    mapped.push({ order: orderOf('updated'), item: { type: 'filter', label: dateLabel } });
  } else if (fromDateFilter?.value) {
    mapped.push({
      order: orderOf('updated'),
      item: {
        type: 'filter',
        label: t('filter.query.fromDate', { date: formatSingleDate(fromDateFilter.value, locale) }),
      },
    });
  } else if (toDateFilter?.value) {
    mapped.push({
      order: orderOf('updated'),
      item: {
        type: 'filter',
        label: t('filter.query.toDate', { date: formatSingleDate(toDateFilter.value, locale) }),
      },
    });
  }

  const params: QueryItemProps[] = mapped.sort((a, b) => a.order - b.order).map((entry) => entry.item);

  if (savedSearch.data?.fromView) {
    const viewType = fromPathToViewType(savedSearch.data.fromView);
    if (viewType !== 'inbox') {
      params.push({ type: 'filter', label: t(`filter.query.${(viewType as string).toLowerCase()}`) });
    }
  }

  if (savedSearch.data?.searchString) {
    params.push({ type: 'search', label: savedSearch.data.searchString });
  }

  return params;
};

export const filterBookmarksBySearch = (
  items: BookmarkSettingsItemProps[],
  query: string,
): BookmarkSettingsItemProps[] => {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title?.toLowerCase().includes(lower) || item.params?.some((p) => p.label?.toLowerCase().includes(lower)),
  );
};
