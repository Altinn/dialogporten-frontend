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
import { type ChangeEvent, type ReactNode, useState } from 'react';
import { deleteNotificationsetting, updateNotificationsetting } from '../../../api/queries';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage';
import { getEnabledNotificationsBadge } from './partyFieldToNotificationsList';

interface NotificationSettingsProps {
  notificationSetting: NotificationSettingsResponse;
}

export const NotificationSetting = ({ notificationSetting }: NotificationSettingsProps) => {
  const [showModal, setShowModal] = useState(false);
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
        onClick={() => setShowModal((prev) => !prev)}
        as="button"
      />
      <AccountNotificationsModal
        title="Varslingsinnstillinger"
        open={showModal}
        onClose={() => setShowModal(false)}
        notificationSetting={notificationSetting}
        notificationSettingProp={notificationSetting}
        onSave={() => setShowModal(false)}
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
  party?: NotificationAccountsType | null;
  notificationSettingProp?: NotificationSettingsResponse | null;
  onClose: () => void;
  onSave: (updatedParty?: NotificationAccountsType) => void;
  partyUuidProp?: string;
}

export const AccountNotificationSettings = ({
  party,
  onClose,
  onSave,
  notificationSettingProp,
  partyUuidProp,
}: AccountNotificationSettingsProps) => {
  const queryClient = useQueryClient();
  const notificationSetting = party?.notificationSettings || notificationSettingProp;
  const alertPhoneNumber = notificationSetting?.phoneNumber || '';
  const alertEmailAddress = notificationSetting?.emailAddress || '';
  const [enablePhoneNotifications, setEnablePhoneNotifications] = useState<boolean>(alertPhoneNumber.length > 0);
  const [enableEmailNotifications, setEnableEmailNotifications] = useState<boolean>(alertEmailAddress.length > 0);
  const [alertEmailAddressState, setAlertEmailAddressState] = useState<string>(alertEmailAddress);
  const [alertPhoneNumberState, setAlertPhoneNumberState] = useState<string>(alertPhoneNumber);

  const partyUuid = notificationSetting?.partyUuid || partyUuidProp || '';

  if (!partyUuid) {
    onClose();
    return;
  }

  const handleUpdateNotificationSettings = async () => {
    const updatedSettings = notificationSetting?.partyUuid
      ? {
          ...notificationSetting,
          userId: notificationSetting.userId,
          partyUuid: partyUuid,
          emailAddress: enableEmailNotifications ? alertEmailAddressState : '',
          phoneNumber: enablePhoneNotifications ? alertPhoneNumberState : '',
        }
      : {
          partyUuid: partyUuid,
          emailAddress: enableEmailNotifications ? alertEmailAddressState : '',
          phoneNumber: enablePhoneNotifications ? alertPhoneNumberState : '',
        };

    try {
      if (enableEmailNotifications || enablePhoneNotifications) {
        await updateNotificationsetting(updatedSettings);
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONSETTINGS] });
        onSave?.({
          ...party,
          notificationSettings: {
            ...notificationSetting,
            emailAddress: enableEmailNotifications ? alertEmailAddressState : '',
            phoneNumber: enablePhoneNotifications ? alertPhoneNumberState : '',
          },
        } as NotificationAccountsType);
      } else {
        deleteNotificationsetting(partyUuid);
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONSETTINGS] });
        onSave?.({
          ...party,
          notificationSettings: {
            ...notificationSetting,
            emailAddress: '',
            phoneNumber: '',
          },
        } as NotificationAccountsType);
      }
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

interface AccountNotificationsModalProps extends AccountModalProps, AccountNotificationSettingsProps {
  notificationSetting: NotificationSettingsResponse | null;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const AccountNotificationsModal = ({
  icon,
  title,
  description,
  open,
  onClose,
  notificationSetting,
}: AccountNotificationsModalProps) => {
  return (
    <AccountModal icon={icon} title={title} description={description} open={open} onClose={onClose}>
      <AccountNotificationSettings notificationSettingProp={notificationSetting} onSave={onClose} onClose={onClose} />
    </AccountModal>
  );
};
