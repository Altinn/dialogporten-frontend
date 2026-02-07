import type { FilterProps, FilterState, MenuItemProps, ToolbarFilterProps } from '@altinn/altinn-components';
import { CalendarIcon, InformationSquareIcon, MenuGridIcon, MenuHamburgerIcon } from '@navikt/aksel-icons';
import {
  type CountableDialogFieldsFragment,
  DialogStatus,
  type GetAllDialogsForPartiesQueryVariables,
  type OrganizationFieldsFragment,
  type ServiceResource,
  SystemLabel,
} from 'bff-types-generated';
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, subMonths, subYears } from 'date-fns';
import { t } from 'i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { getOrganization } from '../../api/utils/organizations.ts';

interface ServiceFilterProps {
  serviceResources: ServiceResource[];
  currentFilters?: FilterState;
  serviceResourcesQuery: string;
  onServiceResourcesQueryChange: (query: string) => void;
}

export const getExclusiveLabel = (labels: string[]): SystemLabel => {
  const EXCLUSIVE_LABELS = [SystemLabel.Archive, SystemLabel.Bin, SystemLabel.Sent, SystemLabel.Default] as const;

  if (!labels || !Array.isArray(labels)) {
    return SystemLabel.Default;
  }

  const match = EXCLUSIVE_LABELS.find((exclusiveLabel) => labels.includes(exclusiveLabel));
  return match ?? SystemLabel.Default;
};

export const countOccurrences = (array: string[]): Record<string, number> => {
  return array.reduce(
    (acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
};

export enum DateFilterOption {
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  LAST_SIX_MONTHS = 'LAST_SIX_MONTHS',
  LAST_TWELVE_MONTHS = 'LAST_TWELVE_MONTHS',
  OLDER_THAN_ONE_YEAR = 'OLDER_THAN_ONE_YEAR',
}

export const getDateRange = (unit: 'day' | 'week' | 'month' | 'sixMonths' | 'year') => {
  const now = new Date();
  switch (unit) {
    case 'day':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'sixMonths':
      return { start: subMonths(now, 6), end: endOfDay(now) };
    case 'year':
      return { start: subYears(now, 1), end: endOfDay(now) };
  }
};

const filterRanges: Record<DateFilterOption, { start?: Date; end?: Date }> = {
  [DateFilterOption.TODAY]: getDateRange('day'),
  [DateFilterOption.THIS_WEEK]: getDateRange('week'),
  [DateFilterOption.THIS_MONTH]: getDateRange('month'),
  [DateFilterOption.LAST_SIX_MONTHS]: getDateRange('sixMonths'),
  [DateFilterOption.LAST_TWELVE_MONTHS]: getDateRange('year'),
  [DateFilterOption.OLDER_THAN_ONE_YEAR]: { end: getDateRange('year').start },
};

export enum FilterCategory {
  ORG = 'org',
  STATUS = 'status',
  UPDATED = 'updated',
  SERVICE = 'service',
}

const getFilteredDialogs = (
  dialogs: CountableDialogFieldsFragment[],
  currentFilters: FilterState,
  excludeFilterCategory?: FilterCategory,
): CountableDialogFieldsFragment[] => {
  return dialogs.filter((dialog) => {
    if (excludeFilterCategory !== FilterCategory.ORG && currentFilters.org?.length) {
      if (!currentFilters.org.includes(dialog.org)) {
        return false;
      }
    }

    if (excludeFilterCategory !== FilterCategory.STATUS && currentFilters.status?.length) {
      const dialogSystemLabel = getExclusiveLabel(dialog.endUserContext?.systemLabels || []);
      const hasMatchingStatus = currentFilters.status.some((status) => {
        if ([SystemLabel.Archive, SystemLabel.Bin, SystemLabel.Sent].includes(status as SystemLabel)) {
          return dialogSystemLabel === status;
        }
        return dialog.status === status;
      });

      if (!hasMatchingStatus) {
        return false;
      }
    }

    if (excludeFilterCategory !== FilterCategory.UPDATED && currentFilters.updated?.length) {
      const dateFilter = currentFilters.updated[0] as DateFilterOption;
      if (dateFilter && filterRanges[dateFilter]) {
        const dialogDate = new Date(dialog.contentUpdatedAt);
        const { start, end } = filterRanges[dateFilter];

        if (start && dialogDate < start) return false;
        if (end && dialogDate > end) return false;
      }
    }

    return true;
  });
};

const createDateOptions = (): MenuItemProps[] => {
  const options = [
    {
      id: DateFilterOption.TODAY,
      role: 'radio',
      value: DateFilterOption.TODAY,
      groupId: 'date-recent',
    },
    {
      id: DateFilterOption.THIS_WEEK,
      role: 'radio',
      value: DateFilterOption.THIS_WEEK,
      groupId: 'date-recent',
    },
    {
      id: DateFilterOption.THIS_MONTH,
      role: 'radio',
      value: DateFilterOption.THIS_MONTH,
      groupId: 'date-recent',
    },
    {
      id: DateFilterOption.LAST_SIX_MONTHS,
      role: 'radio',
      value: DateFilterOption.LAST_SIX_MONTHS,
      groupId: 'date-months',
    },
    {
      id: DateFilterOption.LAST_TWELVE_MONTHS,
      role: 'radio',
      value: DateFilterOption.LAST_TWELVE_MONTHS,
      groupId: 'date-months',
    },
    {
      id: DateFilterOption.OLDER_THAN_ONE_YEAR,
      role: 'radio',
      value: DateFilterOption.OLDER_THAN_ONE_YEAR,
      groupId: 'date-older',
    },
  ];

  return options.map((option) => ({
    ...option,
    label: t(`filter.date.${option.value.toLowerCase()}`),
    name: FilterCategory.UPDATED,
  }));
};

const createSenderOrgFilter = (
  allDialogs: CountableDialogFieldsFragment[],
  allOrganizations: OrganizationFieldsFragment[],
  orgsFromSearchState: string[],
  currentFilters: FilterState = {},
): FilterProps => {
  const filteredDialogs = getFilteredDialogs(allDialogs, currentFilters, FilterCategory.ORG);
  const orgCount = countOccurrences(filteredDialogs.map((d) => d.org));
  const uniqueOrgs = Array.from(new Set([...allDialogs.map((d) => d.org), ...orgsFromSearchState]));

  return {
    id: FilterCategory.ORG,
    icon: MenuHamburgerIcon,
    groupId: 'service-related',
    label: t('filter_bar.label.choose_sender'),
    name: FilterCategory.ORG,
    removable: true,
    groups: {
      'service-owners': {
        title: t('filter_bar.group.choose_sender'),
      },
    },
    items: uniqueOrgs
      .map((org) => ({
        id: org,
        name: FilterCategory.ORG,
        label: getOrganization(allOrganizations, org)?.name || org,
        value: org,
        role: 'checkbox',
        groupId: 'service-owners',
      }))
      .filter((option) => {
        if (orgsFromSearchState.includes(option.value)) {
          return true;
        }
        return (orgCount[option.value] || 0) > 0;
      })
      .sort((a, b) => a.label?.localeCompare(b.label)),
  };
};

const createStatusFilter = (): FilterProps => {
  return {
    id: FilterCategory.STATUS,
    label: t('filter_bar.label.choose_status'),
    groupId: 'status-date',
    icon: InformationSquareIcon,
    name: FilterCategory.STATUS,
    removable: true,
    groups: {
      'status-general': {
        title: t('filter_bar.group.choose_status'),
      },
      'status-active': {},
      'status-draft': {},
      'status-history': {},
    },
    items: [
      {
        id: DialogStatus.NotApplicable,
        label: t('status.not_applicable'),
        groupId: 'status-general',
        value: DialogStatus.NotApplicable,
      },
      {
        id: DialogStatus.RequiresAttention,
        label: t('status.requires_attention'),
        groupId: 'status-active',
        value: DialogStatus.RequiresAttention,
      },
      {
        id: DialogStatus.Awaiting,
        label: t('status.awaiting'),
        groupId: 'status-active',
        value: DialogStatus.Awaiting,
      },
      {
        id: DialogStatus.InProgress,
        label: t('status.in_progress'),
        groupId: 'status-active',
        value: DialogStatus.InProgress,
      },
      {
        id: DialogStatus.Completed,
        label: t('status.completed'),
        groupId: 'status-active',
        value: DialogStatus.Completed,
      },
      {
        id: DialogStatus.Draft,
        label: t('status.draft'),
        groupId: 'status-draft',
        value: DialogStatus.Draft,
      },
      {
        id: SystemLabel.Sent,
        label: t('status.sent'),
        groupId: 'status-history',
        value: SystemLabel.Sent,
      },
      {
        id: SystemLabel.Archive,
        label: t('status.archive'),
        groupId: 'status-history',
        value: SystemLabel.Archive,
      },
      {
        id: SystemLabel.Bin,
        label: t('status.bin'),
        groupId: 'status-history',
        value: SystemLabel.Bin,
      },
    ].map((item) => ({
      ...item,
      role: 'checkbox',
      name: FilterCategory.STATUS,
    })),
  };
};

const createUpdatedAtFilter = (): FilterProps => {
  return {
    icon: CalendarIcon,
    groupId: 'status-date',
    id: FilterCategory.UPDATED,
    name: FilterCategory.UPDATED,
    label: t('filter_bar.label.updated'),
    removable: true,
    groups: {
      'date-recent': {
        title: t('filter_bar.group.choose_date'),
      },
      'date-months': {},
      'date-older': {},
    },
    items: createDateOptions(),
  };
};

const createServiceFilter = ({
  serviceResources,
  currentFilters = {},
  serviceResourcesQuery,
  onServiceResourcesQueryChange,
}: ServiceFilterProps): FilterProps => {
  const serviceResourcesCount = serviceResources.filter((serviceResource) => serviceResource.id).length;
  const groupFallback = serviceResourcesQuery ? 'search' : 'recommendations';
  const allowedGroups = new Set(['recommendations', 'selected', 'search']);
  return {
    id: FilterCategory.SERVICE,
    groupId: 'service-related',
    icon: MenuGridIcon,
    label: t('filter_bar.label.choose_service'),
    name: FilterCategory.SERVICE,
    removable: true,
    searchable: true,
    virtualized: true,
    search: {
      name: 'search-service',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        onServiceResourcesQueryChange(e.target.value);
      },
      onClear: () => {
        onServiceResourcesQueryChange('');
      },
    },
    groups: {
      recommendations: {
        title: t('filter_bar.group.choose_service'),
      },
      selected: {
        title: t('filter_bar.service.selected'),
      },
      search: {
        title: t('filter_bar.service.search_hits', { count: serviceResourcesCount }),
      },
    },
    items: serviceResources
      .filter((serviceResource) => serviceResource.id)
      .map((serviceResource) => {
        const checked = currentFilters.service?.includes(serviceResource.id ?? '') ?? false;
        const title =
          serviceResource.title?.nb || serviceResource.title?.en || serviceResource.title?.nn || serviceResource.id!;
        const normalizedGroupId =
          checked || serviceResource.groupId === 'selected'
            ? 'selected'
            : allowedGroups.has(serviceResource.groupId ?? '')
              ? serviceResource.groupId!
              : groupFallback;
        return {
          groupId: normalizedGroupId,
          label: title,
          value: serviceResource.id!,
          searchWords: [serviceResource.id!, title],
          checked,
          role: 'checkbox',
          name: FilterCategory.SERVICE,
        } as MenuItemProps;
      })
      .sort((a: MenuItemProps, b: MenuItemProps) => {
        const labelA = String(a.label || '');
        const labelB = String(b.label || '');
        return labelA.localeCompare(labelB);
      }),
  };
};

/**
 * Generates filters with suggestions, including count of available items.
 * Counts are calculated across ALL views, not just the current view.
 *
 * @param allDialogs - All dialogs from all views for accurate counting
 * @param allOrganizations
 * @param viewType
 * @param orgsFromSearchState
 * @param serviceResources
 * @param currentFilters - The current filter state to calculate accurate counts
 * @param serviceResourcesQuery
 * @param onServiceResourcesQueryChange
 * @param enableServiceFilter
 * @returns {Array} - The array of filter settings.
 */

export const getFilters = ({
  allDialogs,
  allOrganizations,
  viewType,
  orgsFromSearchState = [],
  serviceResources = [],
  currentFilters,
  serviceResourcesQuery,
  onServiceResourcesQueryChange,
  enableServiceFilter,
}: {
  allDialogs: CountableDialogFieldsFragment[];
  allOrganizations: OrganizationFieldsFragment[];
  viewType: InboxViewType;
  serviceResourcesQuery: string;
  onServiceResourcesQueryChange: (query: string) => void;
  orgsFromSearchState?: string[];
  serviceResources?: ServiceResource[];
  currentFilters?: FilterState;
  enableServiceFilter?: boolean;
}): ToolbarFilterProps['filters'] => {
  const senderOrgFilter = createSenderOrgFilter(allDialogs, allOrganizations, orgsFromSearchState);
  const statusFilter = createStatusFilter();
  const updatedAtFilter = createUpdatedAtFilter();
  const serviceFilter = createServiceFilter({
    serviceResources,
    currentFilters,
    serviceResourcesQuery,
    onServiceResourcesQueryChange,
  });

  const filters = [];

  if (viewType === 'inbox') {
    filters.push(statusFilter);
  }

  filters.push(updatedAtFilter);
  filters.push(senderOrgFilter);

  if (enableServiceFilter) {
    filters.push(serviceFilter);
  }

  return filters.filter((filter) => {
    return filter.name === FilterCategory.SERVICE ? true : filter.items?.length > 0;
  });
};

export const readFiltersFromURLQuery = (query: string): FilterState => {
  const searchParams = new URLSearchParams(query);
  const allowedFilterKeys = Object.values(FilterCategory) as string[];
  const filters: FilterState = {};

  for (const [key, value] of searchParams) {
    if (allowedFilterKeys.includes(key) && value) {
      filters[key] = filters[key] || [];
      filters[key].push(value);
    }
  }

  return filters;
};

interface NormalizeFilterDefaults {
  filters: Partial<FilterState>;
  viewType?: InboxViewType;
  searchQuery?: string;
}

export const presetFiltersByView: Record<InboxViewType, Partial<GetAllDialogsForPartiesQueryVariables>> = {
  inbox: {
    status: [
      DialogStatus.NotApplicable,
      DialogStatus.InProgress,
      DialogStatus.Awaiting,
      DialogStatus.RequiresAttention,
      DialogStatus.Completed,
    ],
    label: [SystemLabel.Default],
  },
  drafts: {
    status: [DialogStatus.Draft],
    label: [SystemLabel.Default],
  },
  sent: {
    label: [SystemLabel.Sent],
  },
  archive: {
    label: [SystemLabel.Archive],
  },
  bin: {
    label: [SystemLabel.Bin],
  },
};

/**
 * Normalizes and merges dialog filter values based on system status labels and view presets.
 *
 * This function performs two key steps:
 * 1. **Normalization**:
 *    - Filters out system labels (`Bin`, `Archive`) from `status` and moves them into `label`.
 *    - Cleans up `status` to only include non-system statuses.
 * 2. **Preset merging**:
 *    - If a `viewType` is provided, merges in default filter presets (`presetFiltersByView`).
 *    - For array fields like `label` and `status`, values are combined and deduplicated.
 *    - For non-array fields, user-provided values take precedence.
 *
 * @param {Object} params
 * @param {FilterState} params.filters - The user-provided filter values.
 * @param {InboxViewType} [params.viewType] - The current inbox view, used to determine which presets to apply.
 * @returns {GetAllDialogsForPartiesQueryVariables} A normalized and preset-merged filter state object.
 */

export const normalizeFilterDefaults = ({
  filters,
  viewType,
  searchQuery,
}: NormalizeFilterDefaults): GetAllDialogsForPartiesQueryVariables => {
  const SYSTEM_LABEL_STATUSES = [SystemLabel.Bin, SystemLabel.Archive, SystemLabel.Sent] as string[];
  const { updatedAfter, ...baseFilters } = filters;
  const { status, org, systemLabel, serviceResources } = baseFilters;
  const normalized: GetAllDialogsForPartiesQueryVariables = { ...baseFilters };

  const hasFilters = [status, org, systemLabel, updatedAfter, serviceResources].some(
    (f) => Array.isArray(f) && f.length > 0,
  );

  if (updatedAfter && filterRanges[updatedAfter as unknown as DateFilterOption]) {
    const { start, end } = filterRanges[updatedAfter as unknown as DateFilterOption];
    if (start) normalized.updatedAfter = start.toISOString();
    if (end) normalized.updatedBefore = end.toISOString();
  }

  const normalizedStatus = (normalized.status ?? []) as string[];
  const systemLabelsInStatus = normalizedStatus.filter((s) => SYSTEM_LABEL_STATUSES.includes(s)) as SystemLabel[];
  const remainingStatus = normalizedStatus.filter((s) => !SYSTEM_LABEL_STATUSES.includes(s)) as DialogStatus[];

  if (systemLabelsInStatus.length > 0) {
    normalized.label = systemLabelsInStatus;
  }
  normalized.status = remainingStatus.length > 0 ? remainingStatus : undefined;

  if ((hasFilters || searchQuery) && viewType === 'inbox') {
    return normalized;
  }

  return mergeFilterDefaults(normalized, viewType);
};

const mergeWithPresets = <T extends Record<string, unknown>>(current: T, presets: Partial<T>): T => {
  const merged = { ...current };

  for (const key of Object.keys(presets) as (keyof T)[]) {
    const presetValue = presets[key];
    const currentValue = merged[key];

    if (Array.isArray(presetValue)) {
      merged[key] = Array.isArray(currentValue)
        ? (Array.from(new Set([...presetValue, ...currentValue])) as T[typeof key])
        : (presetValue as T[typeof key]);
    } else if (typeof currentValue === 'undefined') {
      merged[key] = presetValue as T[typeof key];
    }
  }

  return merged;
};

export const mergeFilterDefaults = (
  currentFilters: GetAllDialogsForPartiesQueryVariables,
  viewType?: InboxViewType,
): GetAllDialogsForPartiesQueryVariables => {
  if (!viewType) return currentFilters;
  const presets = presetFiltersByView[viewType] ?? {};
  return mergeWithPresets(currentFilters, presets);
};

export const aggregateFilterState = (filterState: FilterState, viewType: InboxViewType): FilterState => {
  const presets = presetFiltersByView[viewType];
  if (!presets) return filterState;

  // @ts-ignore
  const asArray = (v: unknown): DialogStatus[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

  return {
    ...filterState,
    status: [...new Set([...asArray(presets.status), ...asArray(presets.label), ...asArray(filterState.status)])],
  };
};
