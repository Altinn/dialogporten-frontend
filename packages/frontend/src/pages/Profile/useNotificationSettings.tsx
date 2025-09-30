import type { NotificationsettingsForCurrentUserQuery } from 'bff-types-generated';
import { getNotificationsettingsForCurrentUser, updateNotificationsetting } from '../../api/queries.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';

export const useNotificationSettingsForCurrentUser = () => {
  const { data, isLoading } = useAuthenticatedQuery<NotificationsettingsForCurrentUserQuery>({
    queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS_FOR_CURRENT_USER],
    queryFn: () => getNotificationsettingsForCurrentUser(),
    refetchOnWindowFocus: false,
  });

  return {
    notificationSettingsForCurrentUser: data?.notificationsettingsForCurrentUser || [],
    isLoading,
    updateNotificationsetting,
  };
};
