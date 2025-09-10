import {
  type BadgeProps,
  Button,
  ButtonGroup,
  Fieldset,
  List,
  ModalBase,
  ModalBody,
  ModalHeader,
  SettingsItem,
  type SettingsItemProps,
  Switch,
  TextField,
} from '@altinn/altinn-components';
import { BellIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NotificationSettingsResponse } from 'bff-types-generated';
import { type ReactNode, useState } from 'react';
import { deleteNotificationsetting, updateNotificationsetting } from '../../../api/queries';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import type { NotificationAccountsType } from '../NotificationsPage/AccountSettings';
import { useProfile } from '../useProfile';
import { getEnabledNotificationsBadge } from './partyFieldToNotificationsList';

interface NotificationSettingsProps {
  notificationSetting: NotificationSettingsResponse;
  setNotificationParty: (notificationParty: NotificationAccountsType) => void;
}

export const NotificationSetting = ({ notificationSetting, setNotificationParty }: NotificationSettingsProps) => {
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

interface AccountModalProps {
  title?: SettingsItemProps['title'];
  icon?: SettingsItemProps['icon'];
  description?: SettingsItemProps['description'];
  open?: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export const AccountModal = ({
  icon,
  title = 'Navn på aktør',
  description,
  open = false,
  onClose,
  children,
}: AccountModalProps) => {
  return (
    <ModalBase open={open} onClose={onClose}>
      <ModalHeader onClose={onClose}>
        <List>
          <SettingsItem icon={icon} title={title} description={description} interactive={false} />
        </List>
      </ModalHeader>
      <ModalBody>{children}</ModalBody>
    </ModalBase>
  );
};

export interface AccountNotificationSettingsProps {
  notificationParty?: NotificationAccountsType | null;
  notificationSettingProp?: NotificationSettingsResponse | null;
  onClose: () => void;
  onSave: (updatedParty?: NotificationAccountsType) => void;
}

export const AccountNotificationSettings = ({
  notificationParty,
  onClose,
  onSave,
  // notificationSettingProp,
}: AccountNotificationSettingsProps) => {
  const queryClient = useQueryClient();
  const { user } = useProfile();
  const notificationSetting = notificationParty?.notificationSettings;
  const alertPhoneNumber = notificationSetting?.phoneNumber || user.phoneNumber || '';
  const alertEmailAddress = notificationSetting?.emailAddress || user.email || '';
  const partyUuid = notificationSetting?.partyUuid || notificationParty?.partyUuid || '';
  const [enablePhoneNotifications, setEnablePhoneNotifications] = useState<boolean>(
    !!notificationSetting?.phoneNumber && alertPhoneNumber.length > 0,
  );
  const [enableEmailNotifications, setEnableEmailNotifications] = useState<boolean>(
    !!notificationSetting?.emailAddress && alertEmailAddress.length > 0,
  );
  const [alertEmailAddressState, setAlertEmailAddressState] = useState<string>(alertEmailAddress);
  const [alertPhoneNumberState, setAlertPhoneNumberState] = useState<string>(alertPhoneNumber);

  const handleUpdateNotificationSettings = async () => {
    const updatedSettings = notificationSetting?.partyUuid
      ? {
          ...notificationSetting,
          userId: notificationSetting.userId,
          partyUuid,
          emailAddress: enableEmailNotifications ? alertEmailAddressState : '',
          phoneNumber: enablePhoneNotifications ? alertPhoneNumberState : '',
        }
      : {
          partyUuid,
          emailAddress: enableEmailNotifications ? alertEmailAddressState : '',
          phoneNumber: enablePhoneNotifications ? alertPhoneNumberState : '',
        };
    try {
      if (enableEmailNotifications || enablePhoneNotifications) {
        await updateNotificationsetting(updatedSettings);
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONSETTINGSFORPARTY] });
        onSave?.({
          ...notificationParty,
          notificationSettings: {
            ...notificationSetting,
            emailAddress: enableEmailNotifications ? alertEmailAddressState : '',
            phoneNumber: enablePhoneNotifications ? alertPhoneNumberState : '',
          },
        } as NotificationAccountsType);
      } else {
        await deleteNotificationsetting(partyUuid);
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONSETTINGSFORPARTY] });
        onSave?.({
          ...notificationParty,
          notificationSettings: {
            ...notificationSetting,
            emailAddress: '',
            phoneNumber: '',
          },
        } as NotificationAccountsType);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  return (
    <>
      <Fieldset size="sm">
        <Switch
          label={'Varsle på SMS'}
          name="smsAlerts"
          value="SMS"
          checked={enablePhoneNotifications}
          onChange={() => setEnablePhoneNotifications((prev) => !prev)}
        />
        {enablePhoneNotifications && (
          <TextField
            name="phone"
            placeholder="Mobiltelefon"
            value={alertPhoneNumberState}
            onChange={(e) => setAlertPhoneNumberState(e.target.value)}
          />
        )}
        <Switch
          label={'Varsle på E-post'}
          name="emailAlerts"
          value="E-post"
          checked={enableEmailNotifications}
          onChange={() => setEnableEmailNotifications((prev) => !prev)}
        />
        {enableEmailNotifications && (
          <TextField
            name="email"
            placeholder="E-postadresse"
            value={alertEmailAddressState}
            onChange={(e) => setAlertEmailAddressState(e.target.value)}
          />
        )}
      </Fieldset>
      <ButtonGroup>
        <Button onClick={handleUpdateNotificationSettings}>Lagre og avslutt</Button>
        <Button variant="outline" onClick={onClose}>
          Avbryt
        </Button>
      </ButtonGroup>
    </>
  );
};
