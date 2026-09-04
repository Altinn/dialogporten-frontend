import type { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys.ts';

/**
 * The dialog view and every separately fetched source behind its activity log.
 *
 * The activity log is assembled from queries that do not share a cache entry with the dialog, so
 * invalidating the dialog alone leaves the log showing the state from before the change. Anything
 * that changes a dialog invalidates all of them together.
 */
const dialogQueryKeys = [
  QUERY_KEYS.DIALOGS,
  QUERY_KEYS.DIALOG_BY_ID,
  QUERY_KEYS.NOTIFICATION_LOGS,
  QUERY_KEYS.LABEL_ASSIGNMENT_LOG,
];

export const invalidateDialogQueries = async (queryClient: QueryClient): Promise<void> => {
  await Promise.all(dialogQueryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey: [queryKey] })));
};
