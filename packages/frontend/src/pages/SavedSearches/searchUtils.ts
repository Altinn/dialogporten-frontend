import type { SavedSearchesFieldsFragment } from 'bff-types-generated';
import type { FormatDistanceFunction } from '../../i18n/useDateFnsLocale.tsx';
import { logError } from '../../utils/errorLogger';

export const autoFormatRelativeTime = (date: Date, formatDistance: FormatDistanceFunction): string => {
  try {
    return formatDistance(new Date(date), new Date(), {
      addSuffix: true,
    });
  } catch (error) {
    logError(
      error as Error,
      {
        context: 'searchUtils.autoFormatRelativeTime',
        date: date.toISOString(),
      },
      'Error formatting relative time',
    );
    return '';
  }
};

export const getMostRecentSearchDate = (data: SavedSearchesFieldsFragment[]): Date | null => {
  try {
    if (!data?.length) {
      return null;
    }
    const timestamp = data?.reduce((latest, search) => {
      return Number.parseInt(search?.updatedAt!, 10) > Number.parseInt(latest?.updatedAt!, 10) ? search : latest;
    })!.updatedAt;
    return new Date(Number.parseInt(timestamp, 10));
  } catch (error) {
    logError(
      error as Error,
      {
        context: 'searchUtils.getMostRecentSearchDate',
        dataLength: data?.length || 0,
      },
      'Error getting most recent search date',
    );
    return null;
  }
};
