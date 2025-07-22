import type { BadgeProps, FilterState, ToolbarFilterProps } from '@altinn/altinn-components';
import {
  type CountableDialogFieldsFragment,
  DialogStatus,
  type GetAllDialogsForPartiesQueryVariables,
  type OrganizationFieldsFragment,
  SystemLabel,
} from 'bff-types-generated';
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, subMonths, subYears } from 'date-fns';
import { t } from 'i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { getOrganization } from '../../api/utils/organizations.ts';

export const getExclusiveLabel = (labels: string[]): SystemLabel => {
  const EXCLUSIVE_LABELS = [SystemLabel.Default, SystemLabel.Archive, SystemLabel.Bin] as const;

  if (!labels || !Array.isArray(labels)) {
    return SystemLabel.Default;
  }

  const match = labels.find((label): label is SystemLabel => EXCLUSIVE_LABELS.includes(label as SystemLabel));
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
}

const getFilterBadgeProps = (filterCount: number | undefined): BadgeProps => {
  if (typeof filterCount === 'number' && filterCount > 0) {
    return { label: String(filterCount), size: 'sm' };
  }
  return { size: 'xs', label: '' };
};

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
        if ([SystemLabel.Archive, SystemLabel.Bin].includes(status as SystemLabel)) {
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
        const dialogDate = new Date(dialog.updatedAt);
        const { start, end } = filterRanges[dateFilter];

        if (start && dialogDate < start) return false;
        if (end && dialogDate > end) return false;
      }
    }

    return true;
  });
};

const createDateOptions = (dates: string[]): ToolbarFilterProps['options'] => {
  const now = new Date();
  const startOfSixMonthsAgo = subMonths(now, 6);
  const sameDateLastYear = subYears(now, 1);

  const dateCounts: Record<DateFilterOption, number> = {
    [DateFilterOption.TODAY]: 0,
    [DateFilterOption.THIS_WEEK]: 0,
    [DateFilterOption.THIS_MONTH]: 0,
    [DateFilterOption.LAST_SIX_MONTHS]: 0,
    [DateFilterOption.LAST_TWELVE_MONTHS]: 0,
    [DateFilterOption.OLDER_THAN_ONE_YEAR]: 0,
  };

  for (const dateStr of dates) {
    const date = new Date(dateStr);

    // TODAY
    if (startOfDay(date).toISOString() === startOfDay(now).toISOString()) {
      dateCounts[DateFilterOption.TODAY]++;
    }

    // THIS_WEEK
    if (startOfWeek(date, { weekStartsOn: 0 }).toISOString() === startOfWeek(now, { weekStartsOn: 0 }).toISOString()) {
      dateCounts[DateFilterOption.THIS_WEEK]++;
    }

    // THIS_MONTH
    if (startOfMonth(date).toISOString() === startOfMonth(now).toISOString()) {
      dateCounts[DateFilterOption.THIS_MONTH]++;
    }

    // LAST_SIX_MONTHS
    if (date >= startOfSixMonthsAgo && date <= endOfDay(now)) {
      dateCounts[DateFilterOption.LAST_SIX_MONTHS]++;
    }

    // LAST_TWELVE_MONTHS
    if (date >= sameDateLastYear && date <= endOfDay(now)) {
      dateCounts[DateFilterOption.LAST_TWELVE_MONTHS]++;
    }

    // OLDER_THAN_ONE_YEAR
    if (date < sameDateLastYear) {
      dateCounts[DateFilterOption.OLDER_THAN_ONE_YEAR]++;
    }
  }

  const options = [
    {
      value: DateFilterOption.TODAY,
      groupId: 'group-0',
    },
    {
      value: DateFilterOption.THIS_WEEK,
      groupId: 'group-0',
    },
    {
      value: DateFilterOption.THIS_MONTH,
      groupId: 'group-0',
    },
    {
      value: DateFilterOption.LAST_SIX_MONTHS,
      groupId: 'group-1',
    },
    {
      value: DateFilterOption.LAST_TWELVE_MONTHS,
      groupId: 'group-1',
    },
    {
      value: DateFilterOption.OLDER_THAN_ONE_YEAR,
      groupId: 'group-2',
    },
  ];

  return options.map((option) => ({
    label: t(`filter.date.${option.value.toLowerCase()}`),
    value: option.value,
    badge: getFilterBadgeProps(dateCounts[option.value]),
    groupId: option.groupId,
  }));
};

const createSenderOrgFilter = (
  allDialogs: CountableDialogFieldsFragment[],
  allOrganizations: OrganizationFieldsFragment[],
  orgsFromSearchState: string[],
  currentFilters: FilterState = {},
): ToolbarFilterProps => {
  const filteredDialogs = getFilteredDialogs(allDialogs, currentFilters, FilterCategory.ORG);
  const orgCount = countOccurrences(filteredDialogs.map((d) => d.org));

  const uniqueOrgs = Array.from(new Set([...allDialogs.map((d) => d.org), ...orgsFromSearchState]));

  return {
    label: t('filter_bar.label.choose_sender'),
    name: FilterCategory.ORG,
    removable: true,
    optionType: 'checkbox',
    options: uniqueOrgs
      .map((org) => ({
        label: getOrganization(allOrganizations, org, 'nb')?.name || org,
        value: org,
        badge: getFilterBadgeProps(orgCount[org] || 0),
      }))
      .sort((a, b) => a.label?.localeCompare(b.label)),
  };
};

const createStatusFilter = (
  allDialogs: CountableDialogFieldsFragment[],
  currentFilters: FilterState = {},
): ToolbarFilterProps => {
  const filteredDialogs = getFilteredDialogs(allDialogs, currentFilters, FilterCategory.STATUS);
  const statusCount = countOccurrences(filteredDialogs.map((d) => d.status));

  const systemLabels = filteredDialogs
    .map((d) => d.endUserContext?.systemLabels || [])
    .map((labels) => getExclusiveLabel(labels));
  const labelCounts = countOccurrences(systemLabels);

  return {
    label: t('filter_bar.label.choose_status'),
    name: FilterCategory.STATUS,
    removable: true,
    optionType: 'checkbox',
    optionGroups: {
      'static-status': {
        title: t('filter_bar.label.static_status'),
        divider: true,
      },
      'dynamic-status': {
        title: t('filter_bar.label.dynamic_status'),
        divider: true,
      },
    },
    options: [
      {
        label: t('status.not_applicable'),
        groupId: 'status-group-0',
        value: DialogStatus.NotApplicable,
        badge: getFilterBadgeProps(statusCount[DialogStatus.NotApplicable] || 0),
      },
      {
        label: t('status.requires_attention'),
        groupId: 'status-group-1',
        value: DialogStatus.RequiresAttention,
        badge: getFilterBadgeProps(statusCount[DialogStatus.RequiresAttention] || 0),
      },
      {
        label: t('status.in_progress'),
        groupId: 'status-group-1',
        value: DialogStatus.InProgress,
        badge: getFilterBadgeProps(statusCount[DialogStatus.InProgress] || 0),
      },
      {
        label: t('status.completed'),
        groupId: 'status-group-1',
        value: DialogStatus.Completed,
        badge: getFilterBadgeProps(statusCount[DialogStatus.Completed] || 0),
      },
      {
        label: t('status.draft'),
        groupId: 'status-group-2',
        value: DialogStatus.Draft,
        badge: getFilterBadgeProps(statusCount[DialogStatus.Draft] || 0),
      },
      {
        label: t('status.awaiting'),
        groupId: 'status-group-2',
        value: DialogStatus.Awaiting,
        badge: getFilterBadgeProps(statusCount[DialogStatus.Awaiting] || 0),
      },
      {
        label: t('status.archive'),
        groupId: 'status-group-3',
        value: SystemLabel.Archive,
        badge: getFilterBadgeProps(labelCounts[SystemLabel.Archive] || 0),
      },
      {
        label: t('status.bin'),
        groupId: 'status-group-3',
        value: SystemLabel.Bin,
        badge: getFilterBadgeProps(labelCounts[SystemLabel.Bin] || 0),
      },
    ],
  };
};

const createUpdatedAtFilter = (
  allDialogs: CountableDialogFieldsFragment[],
  currentFilters: FilterState = {},
): ToolbarFilterProps => {
  const filteredDialogs = getFilteredDialogs(allDialogs, currentFilters, FilterCategory.UPDATED);

  return {
    id: FilterCategory.UPDATED,
    name: FilterCategory.UPDATED,
    label: t('filter_bar.label.updated'),
    optionType: 'radio',
    removable: true,
    options: createDateOptions(filteredDialogs.map((d) => d.updatedAt)),
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
 * @param currentFilters - The current filter state to calculate accurate counts
 * @returns {Array} - The array of filter settings.
 */

export const getFilters = ({
  allDialogs,
  allOrganizations,
  viewType,
  orgsFromSearchState = [],
  currentFilters = {},
}: {
  allDialogs: CountableDialogFieldsFragment[];
  allOrganizations: OrganizationFieldsFragment[];
  viewType: InboxViewType;
  orgsFromSearchState?: string[];
  currentFilters?: FilterState;
}): ToolbarFilterProps[] => {
  const senderOrgFilter = createSenderOrgFilter(allDialogs, allOrganizations, orgsFromSearchState, currentFilters);
  const statusFilter = createStatusFilter(allDialogs, currentFilters);
  const updatedAtFilter = createUpdatedAtFilter(allDialogs, currentFilters);

  return viewType === 'inbox' ? [senderOrgFilter, statusFilter, updatedAtFilter] : [senderOrgFilter, updatedAtFilter];
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
    status: [DialogStatus.Awaiting],
    label: [SystemLabel.Default],
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
  const SYSTEM_LABEL_STATUSES = [SystemLabel.Bin, SystemLabel.Archive] as string[];
  const { updatedAfter, ...baseFilters } = filters;
  const { status, org, systemLabel } = baseFilters;
  const normalized: GetAllDialogsForPartiesQueryVariables = { ...baseFilters };

  const hasFilters = [status, org, systemLabel, updatedAfter].some((f) => Array.isArray(f) && f.length > 0);

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
  if (!viewType) return filterState;

  const presets = presetFiltersByView[viewType] ?? {};
  const merged = { ...filterState };

  const mergeList = <T>(a?: T[], b?: T[], c?: T[]) => Array.from(new Set([...(a ?? []), ...(b ?? []), ...(c ?? [])]));

  if ('status' in presets || 'label' in presets) {
    merged.status = mergeList(
      presets.status as string[] | undefined,
      presets.label as string[] | undefined,
      filterState.status,
    );
  }

  return merged;
};
