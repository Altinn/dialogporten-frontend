import { type BadgeProps, List, SettingsItem } from '@altinn/altinn-components';
import { BellIcon } from '@navikt/aksel-icons';
import type { NotificationSettingsResponse } from 'bff-types-generated';
import type { NotificationAccountsType } from '../NotificationsPage/AccountSettings';
import { getEnabledNotificationsBadge } from './partyFieldToNotificationsList';

interface PartyDetailsSettingProps {
  notificationSetting: NotificationSettingsResponse;
  setNotificationParty: (notificationParty: NotificationAccountsType) => void;
}

export const PartyDetailsSetting = ({ notificationSetting, setNotificationParty }: PartyDetailsSettingProps) => {
  const { emailAddress: alertEmailAddress, phoneNumber: alertPhoneNumber } = notificationSetting;
  const badge = getEnabledNotificationsBadge(alertEmailAddress ?? '', alertPhoneNumber ?? '');
  const title = alertPhoneNumber || alertEmailAddress ? 'Varslinger er på' : 'Ingen varslinger';
  const value =
    alertPhoneNumber && alertEmailAddress
      ? `${alertEmailAddress}, ${alertPhoneNumber}`
      : alertPhoneNumber || alertEmailAddress;

  return (
    <List size="sm">
      <SettingsItem
        icon={BellIcon}
        title={title}
        value={value}
        badge={badge as BadgeProps}
        linkIcon
        onClick={() => setNotificationParty(notificationSetting as NotificationAccountsType)}
        as="button"
      />
    </List>
  );
};
