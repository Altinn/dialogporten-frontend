import type { BookmarkSettingsItemProps, QueryItemProps } from '@altinn/altinn-components';
import { DialogStatus, type SavedSearchesFieldsFragment, type ServiceResource, SystemLabel } from 'bff-types-generated';
import type { Locale } from 'date-fns';
import type { TFunction } from 'i18next';
import { logError } from '../../analytics/errorLogger.ts';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import type { FormatDistanceFunction } from '../../i18n/useDateFnsLocale.tsx';
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

  const params: QueryItemProps[] = filters
    .filter(
      (filter) =>
        filter?.value && !['fromDate', 'toDate'].includes(filter?.id ?? '') && filter?.value !== 'fromAndToDate',
    )
    .map((filter): QueryItemProps => {
      if (filter?.id === 'subAccounts') {
        const subAccountIds = decodeSubAccountIds(filter?.value);
        if (subAccountIds) {
          return {
            type: 'filter',
            label: t('parties.labels.units_count', { count: subAccountIds.length }),
          };
        }
      }

      if (filter?.id === 'org') {
        const orgName = getOrganization(organizations, filter.value ?? '')?.name || filter.value || '';
        return { type: 'filter', label: orgName };
      }

      if (filter?.id === 'service') {
        const service = serviceResourceById.get(filter.value ?? '');
        return { type: 'filter', label: service?.title ?? '' };
      }

      return {
        type: 'filter',
        label: isPlaceholderValue(filter?.value)
          ? t(`filter.query.${(filter?.value ?? '').toLowerCase()}`)
          : (filter?.value ?? ''),
      };
    });

  const dateLabel = formatDateRange(fromDateFilter?.value ?? undefined, toDateFilter?.value ?? undefined, locale);
  if (dateLabel) {
    params.push({ type: 'filter', label: dateLabel });
  } else if (fromDateFilter?.value) {
    params.push({
      type: 'filter',
      label: t('filter.query.fromDate', { date: formatSingleDate(fromDateFilter.value, locale) }),
    });
  } else if (toDateFilter?.value) {
    params.push({
      type: 'filter',
      label: t('filter.query.toDate', { date: formatSingleDate(toDateFilter.value, locale) }),
    });
  }

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

export const autoFormatRelativeTime = (date: Date, formatDistance: FormatDistanceFunction): string => {
  try {
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  } catch (error) {
    logError(
      error as Error,
      { context: 'searchUtils.autoFormatRelativeTime', date: date.toISOString() },
      'Error formatting relative time',
    );
    return '';
  }
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

export const getMostRecentSearchDate = (data: SavedSearchesFieldsFragment[]): Date | null => {
  try {
    if (!data?.length) return null;
    const timestamp = data.reduce(
      (latest, search) =>
        Number.parseInt(search?.updatedAt ?? '0', 10) > Number.parseInt(latest?.updatedAt ?? '0', 10) ? search : latest,
      data[0],
    ).updatedAt;
    return new Date(Number.parseInt(timestamp, 10));
  } catch (error) {
    logError(
      error as Error,
      { context: 'searchUtils.getMostRecentSearchDate', dataLength: data?.length || 0 },
      'Error getting most recent search date',
    );
    return null;
  }
};
