import type { FilterState, ToolbarFilterProps } from '@altinn/altinn-components';
import { type CountableDialogFieldsFragment, DialogStatus, SystemLabel } from 'bff-types-generated';
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, subMonths, subYears } from 'date-fns';
import { t } from 'i18next';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import type { InboxItemInput } from './InboxItemInput.ts';

export const countOccurrences = (array: string[]): Record<string, number> => {
  return array.reduce(
    (acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
};

/**
 * Filters dialogs based on active filters.
 *
 * @param {InboxItemInput[]} dialogs - The array of dialogs to filter.
 * @param {Array} activeFilters - The object of active filter, where each filter is represented by a key used as 'id' and a 'value' (a list).
 * @returns {InboxItemInput[]} - The filtered array of dialogs.
 */
export const filterDialogs = (dialogs: InboxItemInput[], activeFilters: FilterState): InboxItemInput[] => {
  if (!Object.keys(activeFilters).length) {
    return dialogs;
  }

  return dialogs.filter((dialog) => {
    const { sender, recipient } = dialog;

    return Object.keys(activeFilters).every((filterId) => {
      if (!activeFilters[filterId]?.length) {
        return true;
      }

      if (filterId === FilterCategory.ORG) {
        return activeFilters[filterId]?.some((filterValue) => {
          return filterValue === sender.name;
        });
      }

      if (filterId === FilterCategory.RECIPIENT) {
        return activeFilters[filterId]?.some((filterValue) => {
          return filterValue === recipient.name;
        });
      }

      if (filterId === 'updated') {
        const date = new Date(dialog.updatedAt);
        const filterValue = activeFilters[filterId][0] as DateFilterOption;
        const now = new Date();

        const getDateRange = (unit: 'day' | 'week' | 'month' | 'sixMonths' | 'year') => {
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

        const filterRanges: Record<DateFilterOption, { start: Date; end: Date }> = {
          [DateFilterOption.TODAY]: getDateRange('day'),
          [DateFilterOption.THIS_WEEK]: getDateRange('week'),
          [DateFilterOption.THIS_MONTH]: getDateRange('month'),
          [DateFilterOption.LAST_SIX_MONTHS]: getDateRange('sixMonths'),
          [DateFilterOption.LAST_TWELVE_MONTHS]: getDateRange('year'),
          [DateFilterOption.OLDER_THAN_ONE_YEAR]: { start: new Date(0), end: getDateRange('year').start }, // Anything before last year
        };

        const { start, end } = filterRanges[filterValue] ?? {};

        if (filterValue === DateFilterOption.OLDER_THAN_ONE_YEAR) {
          return date < end;
        }
        return date >= start && date <= end;
      }

      return activeFilters[filterId]?.includes(dialog[filterId as keyof InboxItemInput] as string);
    });
  });
};

export enum FilterCategory {
  ORG = 'org',
  RECIPIENT = 'recipient',
  STATUS = 'status',
  UPDATED = 'updated',
  SYSTEM_LABEL = 'systemLabel',
}

export enum DateFilterOption {
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  LAST_SIX_MONTHS = 'LAST_SIX_MONTHS',
  LAST_TWELVE_MONTHS = 'LAST_TWELVE_MONTHS',
  OLDER_THAN_ONE_YEAR = 'OLDER_THAN_ONE_YEAR',
}

const getStartOf = (date: Date, unit: DateFilterOption): string => {
  switch (unit) {
    case DateFilterOption.TODAY:
      return startOfDay(date).toISOString();
    case DateFilterOption.THIS_WEEK:
      return startOfWeek(date, { weekStartsOn: 0 }).toISOString();
    case DateFilterOption.THIS_MONTH:
      return startOfMonth(date).toISOString();
    default:
      return '';
  }
};

const getDateOptions = (dates: Date[]): ToolbarFilterProps['options'] => {
  const now = new Date();
  const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sameDateLastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const options: string[] = [];

  for (const date of dates) {
    const isStartOfDay = getStartOf(date, DateFilterOption.TODAY) === getStartOf(now, DateFilterOption.TODAY);
    const isStartOfWeek = getStartOf(date, DateFilterOption.THIS_WEEK) === getStartOf(now, DateFilterOption.THIS_WEEK);
    const isStartOfMonth =
      getStartOf(date, DateFilterOption.THIS_MONTH) === getStartOf(now, DateFilterOption.THIS_MONTH);

    if (isStartOfDay) options.push(DateFilterOption.TODAY);
    if (isStartOfWeek) options.push(DateFilterOption.THIS_WEEK);
    if (isStartOfMonth) options.push(DateFilterOption.THIS_MONTH);

    if (date >= startOfSixMonthsAgo) options.push(DateFilterOption.LAST_SIX_MONTHS);
    if (date >= sameDateLastYear) options.push(DateFilterOption.LAST_TWELVE_MONTHS);
    if (date < sameDateLastYear) options.push(DateFilterOption.OLDER_THAN_ONE_YEAR);
  }

  const uniqueOptions = Array.from(new Set(options));

  return uniqueOptions.map((option) => ({
    label: t(`filter.date.${option.toLowerCase()}`),
    value: option,
    badge: { label: String(options.filter((o) => o === option).length) },
  }));
};

/**
 * Generates facets for the filters. This will replaced as soon as Dialogporten offers this a response.
 *
 * @param {InboxItemInput[]} dialogs - The array of dialogs to filter.
 * @param currentFilterState
 * @param allDialogs
 * @returns {Array} - The array of filter settings.
 */
export const getFacets = (
  dialogs: InboxItemInput[],
  currentFilterState: FilterState,
  allDialogs: CountableDialogFieldsFragment[],
): ToolbarFilterProps[] => {
  const facets = [
    {
      label: t('filter_bar.label.choose_sender'),
      name: FilterCategory.ORG,
      removable: true,
      optionType: 'checkbox' as ToolbarFilterProps['optionType'],
      options: (() => {
        const { [FilterCategory.ORG]: _, ...filtersWithoutOrg } = currentFilterState;
        const dialogsMatchingOtherFilters = filterDialogs(dialogs, filtersWithoutOrg);

        const allOrgs = Array.from(new Set(allDialogs.map((d) => d.org)));
        const orgsInFilteredDialogs = dialogsMatchingOtherFilters.map((d) => d.org);
        const orgCount = countOccurrences(orgsInFilteredDialogs);

        const uniqueOrgsInFilteredDialogs = Array.from(new Set(orgsInFilteredDialogs));
        const orgsWithoutData = allOrgs.filter((org) => !uniqueOrgsInFilteredDialogs.includes(org));

        const activeOrgOptions = uniqueOrgsInFilteredDialogs.map((org) => ({
          label: org,
          value: org,
          badge: orgCount[org] ? { label: String(orgCount[org]) } : undefined,
        }));

        const inactiveOrgOptions = orgsWithoutData.map((org) => ({
          label: org,
          value: org,
        }));

        return [...activeOrgOptions, ...inactiveOrgOptions];
      })(),
    },
    {
      label: t('filter_bar.label.choose_recipient'),
      name: FilterCategory.RECIPIENT,
      removable: true,
      optionType: 'checkbox' as ToolbarFilterProps['optionType'],
      options: (() => {
        const { [FilterCategory.RECIPIENT]: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters);
        const recipients = filteredDialogs.map((p) => p.recipient.name);
        const recipientsCounts = countOccurrences(recipients);

        return Array.from(new Set(recipients)).map((recipient) => ({
          label: recipient,
          value: recipient,
          badge: recipientsCounts[recipient] ? { label: String(recipientsCounts[recipient]) } : undefined,
        }));
      })(),
    },
    {
      label: t('filter_bar.label.choose_system_label'),
      name: FilterCategory.SYSTEM_LABEL,
      removable: true,
      optionType: 'checkbox' as ToolbarFilterProps['optionType'],
      optionGroups: {
        'static-label': {
          title: t('filter_bar.label.static_label'),
          divider: true,
        },
        'dynamic-label': {
          title: t('filter_bar.label.dynamic_label'),
          divider: true,
        },
      },
      options: (() => {
        const { systemLabel: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters);
        const labels = filteredDialogs.map((p) => p.label);
        const labelCount = countOccurrences(labels);
        const remainingLabels = Object.values(SystemLabel).filter((label) => {
          return !labels.includes(label);
        });

        const dynamicOptions = Array.from(new Set(labels)).map((labelValue) => ({
          label: t(`label.${labelValue.toLowerCase()}`),
          groupId: 'dynamic-label',
          value: labelValue,
          badge: labelCount[labelValue] ? { label: String(labelCount[labelValue]) } : undefined,
        }));

        const staticOptions = remainingLabels.map((labelValue) => ({
          label: t(`label.${labelValue.toLowerCase()}`),
          groupId: 'static-label',
          value: labelValue,
        }));

        return [...dynamicOptions, ...staticOptions];
      })(),
    },
    {
      label: t('filter_bar.label.choose_status'),
      name: FilterCategory.STATUS,
      removable: true,
      optionType: 'checkbox' as ToolbarFilterProps['optionType'],
      search: {
        placeholder: t('filter_bar.label.search'),
      },
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
      options: (() => {
        const { status: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters);
        const status = filteredDialogs.map((p) => p.status);
        const statusCount = countOccurrences(status);
        const remainingStatus = Object.values(DialogStatus).filter((dialogStatus) => {
          return !status.includes(dialogStatus);
        });

        const dynamicOptions = Array.from(new Set(status)).map((statusLabel) => ({
          label: t(`status.${statusLabel.toLowerCase()}`),
          groupId: 'dynamic-status',
          value: statusLabel,
          badge: statusCount[statusLabel] ? { label: String(statusCount[statusLabel]) } : undefined,
        }));

        const staticOptions = remainingStatus.map((statusLabel) => ({
          label: t(`status.${statusLabel.toLowerCase()}`),
          groupId: 'static-status',
          value: statusLabel,
        }));

        return [...dynamicOptions, ...staticOptions];
      })(),
    },
    {
      id: FilterCategory.UPDATED,
      name: FilterCategory.UPDATED,
      label: t('filter_bar.label.updated'),
      optionType: 'radio' as ToolbarFilterProps['optionType'],
      removable: true,
      options: (() => {
        const { updated: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters);
        const dates = filteredDialogs.map((p) => new Date(p.updatedAt));
        return getDateOptions(dates);
      })(),
    },
  ];

  return facets.filter((facet: ToolbarFilterProps) => {
    const filtersForFacet = currentFilterState?.[facet.name];
    if (Array.isArray(filtersForFacet) && filtersForFacet.length > 0) {
      return true;
    }
    return facet.options.length > 1;
  });
};

export const readFiltersFromURLQuery = (query: string): FilterState => {
  const searchParams = new URLSearchParams(query);
  const allowedFilterKeys = Object.values(FilterCategory) as string[];
  const filters: FilterState = {};
  searchParams.forEach((value, key) => {
    if (allowedFilterKeys.includes(key) && value) {
      if (filters[key]) {
        filters[key].push(value);
      } else {
        filters[key] = [value];
      }
    }
  });

  return filters;
};
