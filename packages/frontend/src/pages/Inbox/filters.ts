import type { ToolbarFilterProps } from '@altinn/altinn-components';
import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { t } from 'i18next';
import type { Participant } from '../../api/useDialogById.tsx';
import type { InboxItemInput } from '../../components';
import {
  countOccurrences,
  getPredefinedRange,
  isCombinedDateAndInterval,
} from '../../components/FilterBar/dateInfo.ts';
import type { FormatFunction } from '../../i18n/useDateFnsLocale.tsx';

/**
 * Filters dialogs based on active filters.
 *
 * @param {InboxItemInput[]} dialogs - The array of dialogs to filter.
 * @param {Array} activeFilters - The array of active filter objects, where each filter has an 'id' and a 'value'.
 * @param format
 * @returns {InboxItemInput[]} - The filtered array of dialogs.
 */

export const filterDialogs = (
  dialogs: InboxItemInput[],
  activeFilters: FilterState,
  format: FormatFunction,
): InboxItemInput[] => {
  if (!activeFilters.length) {
    return dialogs;
  }

  return dialogs.filter((item) => {
    return Object.keys(activeFilters).every((filterId) => {
      // Apply OR logic within each filter ID group
      if (filterId === 'sender' || filterId === 'receiver') {
        return activeFilters[filterId]?.some((filterValue) => {
          const participant = item[filterId as keyof InboxItemInput] as Participant;
          return filterValue === participant.name;
        });
      }

      if (filterId === 'updated') {
        return activeFilters[filterId]?.some((filterValue) => {
          const rangeProperties = getPredefinedRange().find((range) => range.value === filterValue);
          const { isDate, endDate, startDate } = isCombinedDateAndInterval(
            rangeProperties?.range ?? (filterValue as string),
            format,
          );

          if (isDate) {
            if (startDate && endDate) {
              return new Date(item.updatedAt) >= startDate && new Date(item.updatedAt) <= endDate;
            }
            if (startDate) {
              return new Date(item.updatedAt) >= startDate;
            }
            return true;
          }
          return new Date(filterValue).toDateString() === new Date(item.updatedAt).toDateString();
        });
      }
      console.info(activeFilters);
      //return activeFilters[filterId]?.includes(item[filterId as keyof InboxItemInput] as string);
    });
  });
};

export enum FilterCategory {
  SENDER = 'sender',
  RECEIVER = 'receiver',
  STATUS = 'status',
  UPDATED = 'updated',
}

/**
 * Generates facets for the filters.
 *
 * @param {InboxItemInput[]} dialogs - The array of dialogs to filter.
 * @param currentFilterState
 * @param format
 * @returns {Array} - The array of filter settings.
 */
export const getFacets = (
  dialogs: InboxItemInput[],
  currentFilterState: FilterState,
  format: FormatFunction,
): ToolbarFilterProps[] => {
  return [
    {
      label: t('filter_bar.label.choose_sender'),
      name: FilterCategory.SENDER,
      optionType: 'checkbox' as ToolbarFilterProps['optionType'],
      options: (() => {
        const { [FilterCategory.SENDER]: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters, format);
        const senders = filteredDialogs.map((p) => p.sender.name);
        const senderCounts = countOccurrences(senders);

        return Array.from(new Set(senders)).map((sender) => ({
          label: `${t('filter_bar_fields.from')} ${sender}`,
          value: sender,
          badge: senderCounts[sender] ? { label: String(senderCounts[sender]) } : undefined,
        }));
      })(),
    },
    /*{
      id: FilterBarIds.SENDER,
      label: t('filter_bar.label.sender'),
      unSelectedLabel: t('filter_bar.label.all_senders'),
      mobileNavLabel: t('filter_bar.label.choose_sender'),
      operation: 'includes',
      options: (() => {
        const { sender: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters, format);
        const senders = filteredDialogs.map((p) => p.sender.name);
        const senderCounts = countOccurrences(senders);

        return Array.from(new Set(senders)).map((sender) => ({
          displayLabel: `${t('filter_bar_fields.from')} ${sender}`,
          value: sender,
          count: senderCounts[sender] ?? 0,
        }));
      })(),
    },
    {
      id: FilterBarIds.RECEIVER,
      label: t('filter_bar.label.recipient'),
      unSelectedLabel: t('filter_bar.label.all_recipients'),
      mobileNavLabel: t('filter_bar.label.choose_recipient'),
      operation: 'includes',
      options: (() => {
        const { receiver: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters, format);

        const receivers = filteredDialogs.map((p) => p.receiver.name);
        const receiversCount = countOccurrences(receivers);
        return Array.from(new Set(receivers)).map((receiver) => ({
          displayLabel: `${t('filter_bar_fields.to')} ${receiver}`,
          value: receiver,
          count: receiversCount[receiver] ?? 0,
        }));
      })(),
    },
    {
      id: FilterBarIds.STATUS,
      label: t('filter_bar.label.status'),
      unSelectedLabel: t('filter_bar.label.all_statuses'),
      mobileNavLabel: t('filter_bar.label.choose_status'),
      operation: 'includes',
      horizontalRule: true,
      options: (() => {
        const { status: _, ...otherFilters } = currentFilterState;
        const filteredDialogs = filterDialogs(dialogs, otherFilters, format);

        const status = filteredDialogs.map((p) => p.status);
        const statusCount = countOccurrences(status);

        return Array.from(new Set(status)).map((statusLabel) => ({
          displayLabel: t(`status.${statusLabel.toLowerCase()}`),
          value: statusLabel,
          count: statusCount[statusLabel] ?? 0,
        }));
      })(),
    },
    {
      id: FilterBarIds.UPDATED,
      label: t('filter_bar.label.updated'),
      mobileNavLabel: t('filter_bar.label.choose_date'),
      unSelectedLabel: t('filter_bar.label.all_dates'),
      operation: 'equals',
      options: generateDateOptions(
        dialogs.map((p) => new Date(p.updatedAt)),
        format,
      ),
    },
     */
  ].filter((facet: ToolbarFilterProps) => facet.options.length > 1);
};

export const createFiltersURLQuery = (activeFilters: FilterState, allFilterKeys: string[], baseURL: string): URL => {
  const url = new URL(baseURL);

  for (const filter of allFilterKeys) {
    url.searchParams.delete(filter);
  }

  for (const [id, value] of Object.entries(activeFilters).filter(([_, value]) => typeof value !== 'undefined')) {
    url.searchParams.append(id, String(value));
  }
  return url;
};

export const readFiltersFromURLQuery = (query: string): FilterState => {
  const searchParams = new URLSearchParams(query);
  const allowedFilterKeys = Object.values(FilterCategory) as string[];
  const filters: FilterState = {};
  searchParams.forEach((value, key) => {
    if (allowedFilterKeys.includes(key)) {
      if (filters[key]) {
        filters[key].push(value);
      } else {
        filters[key] = [value];
      }
    }
  });

  return filters;
};
