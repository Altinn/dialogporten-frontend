import { SettingsList, SettingsSection } from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import type { NotificationSettingsResponse, PartyFieldsFragment } from 'bff-types-generated';
import { useState } from 'react';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import { partyFieldFragmentToNotificationsListItem } from '../PartiesOverviewPage/partyFieldToNotificationsList';
import { usePartiesWithNotificationSettings } from '../usePartiesWithNotificationSettings';
import { NotificationSettingsModal } from './NotificationSettingsModal';

export interface NotificationAccountsType extends PartyFieldsFragment {
  notificationSettings?: NotificationSettingsResponse;
  parentId?: string;
}

export const AccountSettings = () => {
  const [notificationParty, setNotificationParty] = useState<NotificationAccountsType | null>(null);
  const { partiesWithNotificationSettings, isLoading: isLoadingPartiesWithNotificationSettings } =
    usePartiesWithNotificationSettings();
  const queryClient = useQueryClient();

  const onSave = () => {
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE_PARTIES_WITH_NOTIFICATION_SETTINGS] });
  };

  const groups = partiesWithNotificationSettings.reduce<Record<string, { title: string }>>((acc, item) => {
    if (!acc[item.partyUuid]) {
      acc[item.partyUuid] = { title: item.name };
    }
    return acc;
  }, {});

  return (
    <SettingsSection spacing={6}>
      <SettingsList
        groups={groups}
        items={partyFieldFragmentToNotificationsListItem({
          flattenedParties: partiesWithNotificationSettings,
          setNotificationParty,
        })}
      />
      {isLoadingPartiesWithNotificationSettings ? (
        <div>Loading...</div>
      ) : (
        <NotificationSettingsModal
          notificationParty={notificationParty}
          setNotificationParty={setNotificationParty}
          onSave={onSave}
        />
      )}
    </SettingsSection>
  );
};
