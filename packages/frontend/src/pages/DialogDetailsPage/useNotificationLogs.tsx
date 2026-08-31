import type { NotificationLogsQuery } from 'bff-types-generated';
import { getNotificationLogs } from '../../api/queries.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag.ts';

type NotificationLog = NonNullable<NonNullable<NotificationLogsQuery['notificationLogs']>[number]>;

interface UseNotificationLogsOutput {
  notificationLogs: NotificationLog[];
  isLoading: boolean;
}

export const useNotificationLogs = (dialogId?: string): UseNotificationLogsOutput => {
  const enableNotificationLogs = useFeatureFlag<boolean>('dialogDetails.enableNotificationLogs');

  const { data, isLoading } = useAuthenticatedQuery<NotificationLogsQuery>({
    queryKey: [QUERY_KEYS.NOTIFICATION_LOGS, dialogId],
    queryFn: () => getNotificationLogs(dialogId!),
    enabled: !!dialogId && enableNotificationLogs,
    refetchOnWindowFocus: false,
  });

  if (!enableNotificationLogs) {
    return { notificationLogs: [], isLoading: false };
  }

  return {
    notificationLogs: data?.notificationLogs?.filter((log) => log !== null) ?? [],
    isLoading,
  };
};
