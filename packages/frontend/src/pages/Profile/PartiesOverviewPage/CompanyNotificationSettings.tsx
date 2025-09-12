import { Button, ButtonGroup, DsAlert, Fieldset, Switch, TextField } from '@altinn/altinn-components';
import { useState } from 'react';
import { deleteNotificationsetting, updateNotificationsetting } from '../../../api/queries';
import type { NotificationAccountsType } from '../NotificationsPage/AccountSettings';
import { useProfile } from '../useProfile';

export interface CompanyNotificationSettingsProps {
  notificationParty?: NotificationAccountsType | null;
  onClose: () => void;
  onSave: () => void;
}

export const CompanyNotificationSettings = ({
  notificationParty,
  onClose,
  onSave,
}: CompanyNotificationSettingsProps) => {
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
        console.info('updatedSettings', updatedSettings);
        await updateNotificationsetting(updatedSettings);
        onSave?.();
      } else {
        await deleteNotificationsetting(partyUuid);
        onSave?.();
      }
      onClose();
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  const phoneNumberIsValid =
    alertPhoneNumberState.length > 0 ? /^(?:\+47\s?)?\d{8}$/.test(alertPhoneNumberState) : true;
  const emailAddressIsValid =
    alertEmailAddressState.length > 0 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alertEmailAddressState) : true;
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
        {!phoneNumberIsValid && <DsAlert data-color="danger">Telefonnummer er ugyldig</DsAlert>}
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
        {!emailAddressIsValid && <DsAlert data-color="danger">E-postadresse er ugyldig</DsAlert>}
      </Fieldset>
      <ButtonGroup>
        <Button onClick={handleUpdateNotificationSettings} disabled={!phoneNumberIsValid || !emailAddressIsValid}>
          Lagre og avslutt
        </Button>
        <Button variant="outline" onClick={onClose}>
          Avbryt
        </Button>
      </ButtonGroup>
    </>
  );
};
