import { Button, ButtonGroup, Fieldset, Switch, TextField } from '@altinn/altinn-components';
import { useState } from 'react';
import { deleteNotificationsetting, updateNotificationsetting } from '../../../api/queries';
import { useErrorLogger } from '../../../hooks/useErrorLogger';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage';
import { useProfile } from '../useProfile';
import styles from './companyNotificationSettings.module.css';

export interface CompanyNotificationSettingsProps {
  notificationParty?: NotificationAccountsType | null;
  onClose: () => void;
  onSave?: () => void;
}

export const CompanyNotificationSettings = ({
  notificationParty,
  onClose,
  onSave,
}: CompanyNotificationSettingsProps) => {
  const { user } = useProfile();
  const { logError } = useErrorLogger();
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

  const handleUpdateNotificationSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        onSave?.();
      } else {
        await deleteNotificationsetting(partyUuid);
        onSave?.();
      }
      onClose();
    } catch (err) {
      logError(
        err as Error,
        {
          context: 'CompanyNotificationSettings.handleUpdateNotificationSettings',
          partyUuid,
          enablePhoneNotifications,
          enableEmailNotifications,
        },
        'Error updating notification settings',
      );
    }
  };

  return (
    <form onSubmit={handleUpdateNotificationSettings}>
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
            name="tel"
            pattern="^(([0-9]{5})|([0-9]{8})|((00[0-9]{2})[0-9]+)|((\+[0-9]{2})[0-9]+))$"
            required
            onInvalid={(e) => {
              if (e.currentTarget.validity.valueMissing) {
                e.currentTarget.setCustomValidity('Telefonnummer må fylles ut');
              } else if (e.currentTarget.validity.patternMismatch) {
                e.currentTarget.setCustomValidity('Telefonnummer er ugyldig');
              } else {
                e.currentTarget.setCustomValidity('');
              }
            }}
            onChange={(e) => {
              setAlertPhoneNumberState(e.target.value);
              if (e.currentTarget.validity.valueMissing) {
                e.currentTarget.setCustomValidity('Telefonnummer må fylles ut');
              } else if (e.currentTarget.validity.patternMismatch) {
                e.currentTarget.setCustomValidity('Telefonnummer er ugyldig');
              } else {
                e.currentTarget.setCustomValidity('');
              }
            }}
            placeholder="Mobiltelefon"
            value={alertPhoneNumberState}
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
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
            required
            onInvalid={(e) => {
              if (e.currentTarget.validity.valueMissing) {
                e.currentTarget.setCustomValidity('E-postadresse må fylles ut');
              } else if (e.currentTarget.validity.patternMismatch) {
                e.currentTarget.setCustomValidity('E-postadresse er ugyldig');
              } else {
                e.currentTarget.setCustomValidity('');
              }
            }}
            onChange={(e) => {
              setAlertEmailAddressState(e.target.value);
              if (e.currentTarget.validity.valueMissing) {
                e.currentTarget.setCustomValidity('E-postadresse må fylles ut');
              } else if (e.currentTarget.validity.patternMismatch) {
                e.currentTarget.setCustomValidity('E-postadresse er ugyldig');
              } else {
                e.currentTarget.setCustomValidity('');
              }
            }}
            placeholder="E-postadresse"
            value={alertEmailAddressState}
          />
        )}
      </Fieldset>
      <ButtonGroup className={styles.buttonGroup}>
        <Button type="submit">Lagre og avslutt</Button>
        <Button variant="outline" onClick={onClose}>
          Avbryt
        </Button>
      </ButtonGroup>
    </form>
  );
};
