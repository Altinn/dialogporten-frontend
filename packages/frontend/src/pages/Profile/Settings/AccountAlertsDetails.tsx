import {
  Badge,
  Button,
  ButtonGroup,
  Field,
  Fieldset,
  Heading,
  Input,
  Section,
  Switch,
  TextField,
  Typography,
  useSnackbar,
} from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteNotificationsetting, updateNotificationsetting, verifyAddress } from '../../../api/queries.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../../featureFlags/useFeatureFlag.ts';
import { useErrorLogger } from '../../../hooks/useErrorLogger.ts';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage.tsx';
import { useProfile } from '../useProfile.tsx';
import { useVerifiedAddresses } from '../useVerifiedAddresses.tsx';
import styles from './AccountAlertsDetails.module.css';
import { ServiceResourceNotificationsModal } from './ServiceResourceNotificationsModal.tsx';

export interface AccountAlertsDetailsProps {
  notificationParty?: NotificationAccountsType | null;
}

type VerificationStep = 'awaiting_email_code' | 'awaiting_sms_code';

interface PendingVerification {
  step: VerificationStep;
  address: string;
}

export const AccountAlertsDetails = ({ notificationParty }: AccountAlertsDetailsProps) => {
  const { user } = useProfile();
  const queryClient = useQueryClient();
  const { openSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const { logError } = useErrorLogger();
  const { verifiedAddresses } = useVerifiedAddresses();

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

  const [verificationState, setVerificationState] = useState<PendingVerification | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isConfirmingCode, setIsConfirmingCode] = useState(false);

  const isAnotherPerson = notificationParty?.partyType === 'Person' && !notificationParty.isCurrentEndUser;
  const isCompany = notificationParty?.partyType === 'Organization';

  const enableResendVerificationCode = useFeatureFlag<boolean>('profile.enableResendVerificationCode');

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const handleClose = () => {
    document.activeElement?.closest('dialog')?.close();
  };

  const isDirty =
    (enablePhoneNotifications && alertPhoneNumberState !== alertPhoneNumber) ||
    (enableEmailNotifications && alertEmailAddressState !== alertEmailAddress) ||
    enablePhoneNotifications !== (!!notificationSetting?.phoneNumber && alertPhoneNumber.length > 0) ||
    enableEmailNotifications !== (!!notificationSetting?.emailAddress && alertEmailAddress.length > 0);

  const invalidateQueries = () => {
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VERIFIED_ADDRESSES] });
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS_FOR_CURRENT_USER] });
  };

  const isAlreadyVerified = (value: string, type: 'Email' | 'Sms') =>
    verifiedAddresses.some(
      (a: { value?: string | null; addressType?: string | null } | null) =>
        a?.value === value && a?.addressType === type,
    );

  const handleTriggerVerification = async (type: 'email' | 'sms') => {
    setIsSendingCode(true);
    try {
      if (type === 'email') {
        await updateNotificationsetting({
          partyUuid,
          emailAddress: alertEmailAddressState,
          generateVerificationCode: true,
        });
        setVerificationState({ step: 'awaiting_email_code', address: alertEmailAddressState });
      } else {
        await updateNotificationsetting({
          partyUuid,
          phoneNumber: alertPhoneNumberState,
          generateVerificationCode: true,
        });
        setVerificationState({ step: 'awaiting_sms_code', address: alertPhoneNumberState });
      }
      setCodeInput('');
      setCodeError('');
    } catch (err) {
      logError(
        err as Error,
        { context: 'AccountAlertsDetails.handleTriggerVerification' },
        'Error sending verification code',
      );
      openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleConfirmCode = async () => {
    if (!verificationState) return;
    setIsConfirmingCode(true);
    setCodeError('');
    try {
      const result = await verifyAddress({
        value: verificationState.address,
        type: verificationState.step === 'awaiting_email_code' ? 'Email' : 'Sms',
        verificationCode: codeInput,
      });
      if (result?.verifyAddress?.success) {
        invalidateQueries();
        setVerificationState(null);
      } else {
        setCodeError(t('profile.verification.code_invalid'));
      }
    } catch (err) {
      logError(
        err as Error,
        { context: 'AccountAlertsDetails.handleConfirmCode' },
        'Error confirming verification code',
      );
      openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
    } finally {
      setIsConfirmingCode(false);
    }
  };

  const handleResend = async () => {
    if (!verificationState) return;
    setIsSendingCode(true);
    try {
      if (verificationState.step === 'awaiting_email_code') {
        await updateNotificationsetting({
          partyUuid,
          emailAddress: verificationState.address,
          generateVerificationCode: true,
        });
      } else {
        await updateNotificationsetting({
          partyUuid,
          phoneNumber: verificationState.address,
          generateVerificationCode: true,
        });
      }
    } catch (err) {
      logError(err as Error, { context: 'AccountAlertsDetails.handleResend' }, 'Error resending verification code');
      openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleUpdateNotificationSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedSettings = {
      partyUuid,
      userId: notificationSetting?.userId,
      emailAddress: enableEmailNotifications ? alertEmailAddressState : '',
      phoneNumber: enablePhoneNotifications ? alertPhoneNumberState : '',
      resourceIncludeList: notificationSetting?.resourceIncludeList,
    };
    try {
      if (enableEmailNotifications || enablePhoneNotifications) {
        const result = await updateNotificationsetting(updatedSettings);
        if (result?.updateNotificationSetting?.success) {
          handleClose();
          openSnackbar({ message: t('profile.account_alerts.snackbar.success'), color: 'company' });
        } else {
          openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
        }
      } else {
        await deleteNotificationsetting(partyUuid);
        handleClose();
        openSnackbar({ message: t('profile.account_alerts.snackbar.success'), color: 'company' });
      }
    } catch (err) {
      logError(
        err as Error,
        { context: 'AccountAlertsDetails.handleUpdateNotificationSettings', partyUuid },
        'Error updating notification settings',
      );
      openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
    } finally {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS_FOR_CURRENT_USER] });
    }
  };

  const isEmailVerified = !!alertEmailAddressState && isAlreadyVerified(alertEmailAddressState, 'Email');
  const isPhoneVerified = !!alertPhoneNumberState && isAlreadyVerified(alertPhoneNumberState, 'Sms');
  const hasUnverifiedEmail = enableEmailNotifications && !!alertEmailAddressState && !isEmailVerified;
  const hasUnverifiedSms = enablePhoneNotifications && !!alertPhoneNumberState && !isPhoneVerified;
  const needsVerification = hasUnverifiedEmail || hasUnverifiedSms;

  if (verificationState) {
    const isEmail = verificationState.step === 'awaiting_email_code';
    return (
      <Section spacing={4}>
        <Heading size="sm">{t('profile.verification.verify_address_title')}</Heading>
        <TextField
          label={
            isEmail ? t('profile.account_alerts.email_placeholder') : t('profile.account_alerts.phone_placeholder')
          }
          value={verificationState.address}
          readOnly
          size="sm"
        />
        <TextField
          label={t('profile.verification.code_label')}
          value={codeInput}
          onChange={(e) => {
            setCodeInput(e.target.value);
            setCodeError('');
          }}
          placeholder={t('profile.verification.code_placeholder')}
          inputMode="numeric"
          autoComplete="one-time-code"
        />
        <Typography size="sm">
          <p>{isEmail ? t('profile.verification.code_hint_email') : t('profile.verification.code_hint_sms')}</p>
        </Typography>
        {codeError && <Typography size="sm">{codeError}</Typography>}
        <ButtonGroup>
          <Button type="button" variant="tinted" onClick={handleConfirmCode} disabled={isConfirmingCode || !codeInput}>
            {t('profile.verification.confirm_button')}
          </Button>
          {enableResendVerificationCode && (
            <Button type="button" variant="outline" onClick={handleResend} disabled={isSendingCode}>
              {t('profile.verification.resend_code')}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => setVerificationState(null)}>
            {t('profile.account_alerts.cancel')}
          </Button>
        </ButtonGroup>
      </Section>
    );
  }

  return (
    <>
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
              <Field>
                <div className={styles.fieldWrapper}>
                  <Input
                    name="tel"
                    size="sm"
                    value={alertPhoneNumberState}
                    onChange={(e) => setAlertPhoneNumberState(e.target.value)}
                    placeholder={t('profile.account_alerts.phone_placeholder')}
                    autoComplete="tel"
                  />
                  {alertPhoneNumberState && (
                    <span data-size="sm" className={styles.badgeOverlay}>
                      <Badge color={isPhoneVerified ? 'success' : 'company'}>
                        {isPhoneVerified
                          ? t('profile.verification.status_verified')
                          : t('profile.verification.status_new_sms')}
                      </Badge>
                    </span>
                  )}
                </div>
              </Field>
            )}
            <Switch
              label={t('profile.account_alerts.notify_email')}
              name="emailAlerts"
              value={t('profile.account_alerts.switch_email_value')}
              checked={enableEmailNotifications}
              onChange={() => setEnableEmailNotifications((prev) => !prev)}
            />
            {enableEmailNotifications && (
              <Field>
                <div className={styles.fieldWrapper}>
                  <Input
                    name="email"
                    size="sm"
                    value={alertEmailAddressState}
                    onChange={(e) => setAlertEmailAddressState(e.target.value)}
                    placeholder={t('profile.account_alerts.email_placeholder')}
                    autoComplete="email"
                  />
                  {alertEmailAddressState && (
                    <span data-size="sm" className={styles.badgeOverlay}>
                      <Badge color={isEmailVerified ? 'success' : 'company'}>
                        {isEmailVerified
                          ? t('profile.verification.status_verified')
                          : t('profile.verification.status_new_address')}
                      </Badge>
                    </span>
                  )}
                </div>
              </Field>
            )}
          </Fieldset>
          <Typography size="sm">
            {isAnotherPerson && <p>{t('profile.notifications.personal_for_person')}</p>}
            {isCompany && (
              <p>
                {t('profile.notifications.personal_explanation')}{' '}
                <button type="button" className={styles.linkButton} onClick={() => setIsServiceModalOpen(true)}>
                  {t('profile.account_alerts.single_service_notifications')}
                </button>
              </p>
            )}
          </Typography>
          {needsVerification && (
            <Typography size="sm">
              <p>{t('profile.account_alerts.new_addresses_must_verify')}</p>
            </Typography>
          )}
          <ButtonGroup>
            {hasUnverifiedEmail && (
              <Button
                type="button"
                variant="tinted"
                onClick={() => handleTriggerVerification('email')}
                disabled={isSendingCode}
              >
                {t('profile.account_alerts.verify_email')}
              </Button>
            )}
            {hasUnverifiedSms && (
              <Button
                type="button"
                variant="tinted"
                onClick={() => handleTriggerVerification('sms')}
                disabled={isSendingCode}
              >
                {t('profile.account_alerts.verify_sms')}
              </Button>
            )}
            {!needsVerification && isDirty && <Button type="submit">{t('profile.account_alerts.save')}</Button>}
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('word.close')}
            </Button>
          </ButtonGroup>
        </Section>
      </form>
      <ServiceResourceNotificationsModal
        open={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        notificationParty={notificationParty}
      />
    </>
  );
};
