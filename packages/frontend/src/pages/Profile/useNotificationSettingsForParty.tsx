import type { NotificationSettingsResponse, NotificationsettingsByUuidQuery } from 'bff-types-generated';
import { getNotificationsettingsByUuid, updateNotificationsetting } from '../../api/queries.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';

export const useNotificationSettingsForParty = (partyUuid?: string) => {
  if (!partyUuid) {
    return {
      notificationSettings: null,
      isLoading: false,
      updateNotificationsetting,
    };
  }

  const { data, isLoading } = useAuthenticatedQuery<NotificationsettingsByUuidQuery>({
    queryKey: [QUERY_KEYS.NOTIFICATIONSETTINGSFORPARTY, partyUuid],
    queryFn: () => getNotificationsettingsByUuid(partyUuid),
    refetchOnWindowFocus: false,
  });

  return {
    notificationSettingsForParty: (data?.notificationsettingsByUuid as NotificationSettingsResponse) || null,
    isLoading,
    updateNotificationsetting,
  };
};
