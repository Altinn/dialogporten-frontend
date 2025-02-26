import type { FilterState, ToolbarFilterProps } from '@altinn/altinn-components';
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, subMonths, subYears } from 'date-fns';
import { t } from 'i18next';
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
    const { sender, receiver } = dialog;

    return Object.keys(activeFilters).every((filterId) => {
      if (!activeFilters[filterId]?.length) {
        return true;
      }

      if (filterId === FilterCategory.SENDER) {
        return activeFilters[filterId]?.some((filterValue) => {
          return filterValue === sender.name;
        });
      }

      if (filterId === FilterCategory.RECEIVER) {
        return activeFilters[filterId]?.some((filterValue) => {
          return filterValue === receiver.name;
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
  SENDER = 'sender',
  RECEIVER = 'receiver',
  STATUS = 'status',
  UPDATED = 'updated',
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
 * @returns {Array} - The array of filter settings.
 */
export const getFacets = (dialogs: InboxItemInput[], currentFilterState: FilterState): ToolbarFilterProps[] => {
  if (!dialogs.length) {
    return [];
  }
  const facets = [
    {
      label: t('filter_bar.label.choose_sender'),
      name: FilterCategory.SENDER,
      removable: true,
      optionType: 'checkbox' as ToolbarFilterProps['optionType'],
      options: (() => {
        const { [FilterCategory.SENDER]: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters);
        const senders = filteredDialogs.map((p) => p.sender.name);
        const senderCounts = countOccurrences(senders);

        return Array.from(new Set(senders)).map((sender) => ({
          label: sender,
          value: sender,
          badge: senderCounts[sender] ? { label: String(senderCounts[sender]) } : undefined,
        }));
      })(),
    },
    {
      label: t('filter_bar.label.choose_recipient'),
      name: FilterCategory.RECEIVER,
      removable: true,
      optionType: 'checkbox' as ToolbarFilterProps['optionType'],
      options: (() => {
        const { [FilterCategory.RECEIVER]: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters);
        const recipients = filteredDialogs.map((p) => p.receiver.name);
        const recipientsCounts = countOccurrences(recipients);

        return Array.from(new Set(recipients)).map((recipient) => ({
          label: recipient,
          value: recipient,
          badge: recipientsCounts[recipient] ? { label: String(recipientsCounts[recipient]) } : undefined,
        }));
      })(),
    },
    {
      label: t('filter_bar.label.choose_status'),
      name: FilterCategory.STATUS,
      removable: true,
      optionType: 'checkbox' as ToolbarFilterProps['optionType'],
      options: (() => {
        const { status: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters);
        const status = filteredDialogs.map((p) => p.status);
        const statusCount = countOccurrences(status);

        return Array.from(new Set(status)).map((statusLabel) => ({
          label: t(`status.${statusLabel.toLowerCase()}`),
          value: statusLabel,
          badge: statusCount[statusLabel] ? { label: String(statusCount[statusLabel]) } : undefined,
        }));
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

  if (!Object.keys(currentFilterState).length) {
    return facets.filter((facet: ToolbarFilterProps) => facet.options.length > 1);
  }
  return facets;
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
