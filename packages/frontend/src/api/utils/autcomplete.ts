import type { SearchAutocompleteDialogFieldsFragment } from 'bff-types-generated';
import { getPreferredPropertyByLocale } from '../../i18n/property.ts';
export interface SearchAutocompleteDialogInput {
  id: string;
  title: string;
  summary: string;
  isSeenByEndUser: boolean;
}

export function mapAutocompleteDialogsDtoToInboxItem(
  input: SearchAutocompleteDialogFieldsFragment[],
): SearchAutocompleteDialogInput[] {
  return input.map((item) => {
    const titleObj = item.content.title.value;
    const summaryObj = item.content.summary.value;
    const isSeenByEndUser =
      item.seenSinceLastUpdate.find((seenLogEntry) => seenLogEntry.isCurrentEndUser) !== undefined;
    return {
      id: item.id,
      title: getPreferredPropertyByLocale(titleObj)?.value ?? '',
      summary: getPreferredPropertyByLocale(summaryObj)?.value ?? '',
      isSeenByEndUser,
    };
  });
}
