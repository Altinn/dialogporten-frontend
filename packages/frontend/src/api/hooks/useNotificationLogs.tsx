import type { NotificationLogsQuery } from 'bff-types-generated';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';
import type { NotificationLog } from '../../utils/notificationLogs.tsx';
import { getNotificationLogs } from '../queries.ts';

interface UseNotificationLogsOutput {
  notificationLogs: NotificationLog[];
  isLoading: boolean;
}

export const useNotificationLogs = (dialogId?: string, hasDialogAccess = false): UseNotificationLogsOutput => {
  const enableNotificationLogs = useFeatureFlag<boolean>('dialogDetails.enableNotificationLogs');

  const { data, isLoading } = useAuthenticatedQuery<NotificationLogsQuery>({
    queryKey: [QUERY_KEYS.NOTIFICATION_LOGS, dialogId],
    queryFn: () => getNotificationLogs(dialogId!),
    enabled: !!dialogId && hasDialogAccess && enableNotificationLogs,
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (!enableNotificationLogs) {
    return { notificationLogs: [], isLoading: false };
  }

  return {
    notificationLogs: data?.notificationLogs?.filter((log) => log !== null) ?? [],
    isLoading,
  };
};
