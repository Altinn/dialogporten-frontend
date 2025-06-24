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
import type { InboxItemInput } from './InboxItemInput.ts';

export const getExclusiveLabel = (labels: string[]): SystemLabel => {
  const EXCLUSIVE_LABELS = [SystemLabel.Default, SystemLabel.Archive, SystemLabel.Bin] as const;

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
    return {
      label: String(filterCount),
      size: 'sm',
    };
  }
  return {
    size: 'xs',
    label: '',
  };
};

const getDateOptions = (dates: string[]): ToolbarFilterProps['options'] => {
  const now = new Date();
  const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sameDateLastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const options = [
    {
      value: DateFilterOption.TODAY,
      match: (date: Date) => startOfDay(date).toISOString() === startOfDay(now).toISOString(),
      groupId: 'group-0',
    },
    {
      value: DateFilterOption.THIS_WEEK,
      match: (date: Date) =>
        startOfWeek(date, { weekStartsOn: 0 }).toISOString() === startOfWeek(now, { weekStartsOn: 0 }).toISOString(),
      groupId: 'group-0',
    },
    {
      value: DateFilterOption.THIS_MONTH,
      match: (date: Date) => startOfMonth(date).toISOString() === startOfMonth(now).toISOString(),
      groupId: 'group-0',
    },
    {
      value: DateFilterOption.LAST_SIX_MONTHS,
      match: (date: Date) => date >= startOfSixMonthsAgo,
      groupId: 'group-1',
    },
    {
      value: DateFilterOption.LAST_TWELVE_MONTHS,
      match: (date: Date) => date >= sameDateLastYear,
      groupId: 'group-1',
    },
    {
      value: DateFilterOption.OLDER_THAN_ONE_YEAR,
      match: (date: Date) => date < sameDateLastYear,
      groupId: 'group-2',
    },
  ];

  return options.map((option) => {
    const count = dates.filter((d) => option.match(new Date(d))).length;

    return {
      label: t(`filter.date.${option.value.toLowerCase()}`),
      value: option.value,
      badge: getFilterBadgeProps(count),
      groupId: option.groupId,
    };
  });
};

/**
 * Generates filters with suggestions, including count of available items.
 *
 * @param {InboxItemInput[]} dialogs - The array of dialogs to filter.
 * @param allDialogs
 * @param allOrganizations
 * @param viewType
 * @returns {Array} - The array of filter settings.
 */
export const getFilters = (
  dialogs: InboxItemInput[],
  allDialogs: CountableDialogFieldsFragment[],
  allOrganizations: OrganizationFieldsFragment[],
  viewType: InboxViewType,
): ToolbarFilterProps[] => {
  const orgsInFilteredDialogs = dialogs.map((d) => d.org);
  const orgCount = countOccurrences(orgsInFilteredDialogs);

  const allOrgsFromDialogs = dialogs.map((d) => d.org);
  const allOrgsFromAllDialogs = allDialogs.map((d) => d.org);
  const orgsFoundInAllDialogs = Array.from(new Set([...allOrgsFromDialogs, ...allOrgsFromAllDialogs]));

  const senderOrgFilter: ToolbarFilterProps = {
    label: t('filter_bar.label.choose_sender'),
    name: FilterCategory.ORG,
    removable: true,
    optionType: 'checkbox',
    options: orgsFoundInAllDialogs
      .map((org) => ({
        label: getOrganization(allOrganizations, org, 'nb')?.name || org,
        value: org,
        badge: getFilterBadgeProps(orgCount[org]),
      }))
      .sort((a, b) => a.label?.localeCompare(b.label)),
  };

  const statusList = dialogs.map((p) => p.status);
  const labelList = dialogs.map((p) => p.label);
  const systemLabels = labelList.map((label) => getExclusiveLabel(label));
  const statusCount = countOccurrences(statusList);
  const labelCounts = countOccurrences(systemLabels);

  const statusFilter: ToolbarFilterProps = {
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
        badge: getFilterBadgeProps(statusCount[DialogStatus.NotApplicable]),
      },
      {
        label: t('status.requires_attention'),
        groupId: 'status-group-1',
        value: DialogStatus.RequiresAttention,
        badge: getFilterBadgeProps(statusCount[DialogStatus.RequiresAttention]),
      },
      {
        label: t('status.in_progress'),
        groupId: 'status-group-1',
        value: DialogStatus.InProgress,
        badge: getFilterBadgeProps(statusCount[DialogStatus.InProgress]),
      },
      {
        label: t('status.completed'),
        groupId: 'status-group-1',
        value: DialogStatus.Completed,
        badge: getFilterBadgeProps(statusCount[DialogStatus.Completed]),
      },
      {
        label: t('status.draft'),
        groupId: 'status-group-2',
        value: DialogStatus.Draft,
        badge: getFilterBadgeProps(statusCount[DialogStatus.Draft]),
      },
      {
        label: t('status.awaiting'),
        groupId: 'status-group-2',
        value: DialogStatus.Awaiting,
        badge: getFilterBadgeProps(statusCount[DialogStatus.Awaiting]),
      },
      {
        label: t('status.archive'),
        groupId: 'status-group-3',
        value: SystemLabel.Archive,
        badge: getFilterBadgeProps(labelCounts[SystemLabel.Archive]),
      },
      {
        label: t('status.bin'),
        groupId: 'status-group-3',
        value: SystemLabel.Bin,
        badge: getFilterBadgeProps(labelCounts[SystemLabel.Bin]),
      },
    ],
  };

  const updatedAtFilter: ToolbarFilterProps = {
    id: FilterCategory.UPDATED,
    name: FilterCategory.UPDATED,
    label: t('filter_bar.label.updated'),
    optionType: 'radio',
    removable: true,
    options: getDateOptions(dialogs.map((d) => d.updatedAt)),
  };

  if (viewType === 'inbox') {
    return [senderOrgFilter, statusFilter, updatedAtFilter];
  }
  return [senderOrgFilter, updatedAtFilter];
};

export const readFiltersFromURLQuery = (query: string): FilterState => {
  const searchParams = new URLSearchParams(query);
  const allowedFilterKeys = Object.values(FilterCategory) as string[];
  const filters: FilterState = {};

  searchParams.forEach((value, key) => {
    if (allowedFilterKeys.includes(key) && value) {
      if (!filters[key]) {
        filters[key] = [];
      }
      filters[key].push(value);
    }
  });

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
    if (start) {
      normalized.updatedAfter = start.toISOString();
    }
    if (end) {
      normalized.updatedBefore = end.toISOString();
    }
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

function mergeWithPresets<T extends Record<string, unknown>>(current: T, presets: Partial<T>): T {
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
}

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
