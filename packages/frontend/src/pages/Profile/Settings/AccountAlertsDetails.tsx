import {
  Button,
  ButtonGroup,
  Fieldset,
  Section,
  Switch,
  TextField,
  Typography,
  useSnackbar,
} from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteNotificationsetting, updateNotificationsetting } from '../../../api/queries.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { useErrorLogger } from '../../../hooks/useErrorLogger.ts';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage.tsx';
import { useProfile } from '../useProfile.tsx';

export interface AccountAlertsDetailsProps {
  notificationParty?: NotificationAccountsType | null;
}

export const AccountAlertsDetails = ({ notificationParty }: AccountAlertsDetailsProps) => {
  const { user } = useProfile();
  const queryClient = useQueryClient();
  const { openSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const { logError } = useErrorLogger();
  const notificationSetting = notificationParty?.notificationSettings;
  const alertPhoneNumber = notificationSetting?.phoneNumber || user?.phoneNumber || '';
  const alertEmailAddress = notificationSetting?.emailAddress || user?.email || '';
  const partyUuid = notificationSetting?.partyUuid || notificationParty?.partyUuid || '';
  const [enablePhoneNotifications, setEnablePhoneNotifications] = useState<boolean>(
    !!notificationSetting?.phoneNumber && alertPhoneNumber.length > 0,
  );
  const [enableEmailNotifications, setEnableEmailNotifications] = useState<boolean>(
    !!notificationSetting?.emailAddress && alertEmailAddress.length > 0,
  );
  const [alertEmailAddressState, setAlertEmailAddressState] = useState<string>(alertEmailAddress);
  const [alertPhoneNumberState, setAlertPhoneNumberState] = useState<string>(alertPhoneNumber);

  const isAnotherPerson = notificationParty?.partyType === 'Person' && !notificationParty.isCurrentEndUser;
  const isCompany = notificationParty?.partyType === 'Organization';

  const handleClose = () => {
    /* Close the nearest <dialog> element (since this component is rendered inside it)
Using `closest('dialog')` keeps it scoped to this instance instead of querying the entire DOM.
This is a pragmatic solution until the dialog exposes an onClose prop or ref we can call directly. */
    document.activeElement?.closest('dialog')?.close();
  };

  const organizationContactEmailPattern =
    /^(?:(?:"[^"]+")|(?:[a-zA-Z0-9!#$%&'*+\-=?^_`{|}~]+(?:\.[a-zA-Z0-9!#$%&'*+\-=?^_`{|}~]+)*))@(?:(?:[a-zA-Z0-9æøåÆØÅ](?:[a-zA-Z0-9\-æøåÆØÅ]{0,61}[a-zA-Z0-9æøåÆØÅ])?\.){1,9}[a-zA-Z]{2,14}|\d{1,3}(?:\.\d{1,3}){3})$/;

  const isDirty =
    (enablePhoneNotifications && alertPhoneNumberState !== alertPhoneNumber) ||
    (enableEmailNotifications && alertEmailAddressState !== alertEmailAddress) ||
    enablePhoneNotifications !== (!!notificationSetting?.phoneNumber && alertPhoneNumber.length > 0) ||
    enableEmailNotifications !== (!!notificationSetting?.emailAddress && alertEmailAddress.length > 0);

  const handleUpdateNotificationSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    handleClose();

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
        const result = await updateNotificationsetting(updatedSettings);
        if (!result?.updateNotificationSetting?.success) {
          openSnackbar({
            message: t('profile.account_alerts.snackbar.error'),
            color: 'danger',
          });
        } else {
          openSnackbar({
            message: t('profile.account_alerts.snackbar.success'),
            color: 'accent',
          });
        }
      } else {
        await deleteNotificationsetting(partyUuid);
        openSnackbar({
          message: t('profile.account_alerts.snackbar.success'),
          color: 'accent',
        });
      }
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
      openSnackbar({
        message: t('profile.account_alerts.snackbar.error'),
        color: 'danger',
      });
    } finally {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS_FOR_CURRENT_USER] });
    }
  };

  return (
    <form onSubmit={handleUpdateNotificationSettings}>
      <Section spacing={6}>
        <Fieldset size="sm">
          <Switch
            label={t('profile.account_alerts.notify_sms')}
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
                  e.currentTarget.setCustomValidity(t('profile.account_alerts.phone_required'));
                } else if (e.currentTarget.validity.patternMismatch) {
                  e.currentTarget.setCustomValidity(t('profile.account_alerts.phone_invalid'));
                } else {
                  e.currentTarget.setCustomValidity('');
                }
              }}
              onChange={(e) => {
                setAlertPhoneNumberState(e.target.value);
                if (e.currentTarget.validity.valueMissing) {
                  e.currentTarget.setCustomValidity(t('profile.account_alerts.phone_required'));
                } else if (e.currentTarget.validity.patternMismatch) {
                  e.currentTarget.setCustomValidity(t('profile.account_alerts.phone_invalid'));
                } else {
                  e.currentTarget.setCustomValidity('');
                }
              }}
              placeholder={t('profile.account_alerts.phone_placeholder')}
              value={alertPhoneNumberState}
            />
          )}
          <Switch
            label={t('profile.account_alerts.notify_email')}
            name="emailAlerts"
            value={t('profile.account_alerts.switch_email_value')}
            checked={enableEmailNotifications}
            onChange={() => setEnableEmailNotifications((prev) => !prev)}
          />
          {enableEmailNotifications && (
            <TextField
              name="email"
              type="email"
              required
              pattern={organizationContactEmailPattern.source}
              value={alertEmailAddressState}
              onChange={(e) => {
                setAlertEmailAddressState(e.currentTarget.value);
                if (!organizationContactEmailPattern.test(e.currentTarget.value)) {
                  e.currentTarget.setCustomValidity(t('profile.account_alerts.email_invalid'));
                } else {
                  e.currentTarget.setCustomValidity('');
                }
              }}
            />
          )}
        </Fieldset>
        <Typography size="sm">
          {isAnotherPerson && <p>{t('profile.notifications.personal_for_person')}</p>}
          {isCompany && <p>{t('profile.notifications.personal_explanation')}</p>}
        </Typography>
        <ButtonGroup>
          <Button type="submit" disabled={!isDirty}>
            {t('profile.account_alerts.save')}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('profile.account_alerts.cancel')}
          </Button>
        </ButtonGroup>
      </Section>
    </form>
  );
};
