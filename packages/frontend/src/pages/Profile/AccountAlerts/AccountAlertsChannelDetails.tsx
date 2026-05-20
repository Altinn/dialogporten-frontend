import {
  Badge,
  Button,
  ButtonGroup,
  Field,
  Fieldset,
  Input,
  Label,
  Section,
  Switch,
  Typography,
  useSnackbar,
} from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendVerificationCode, updateNotificationsetting, verifyAddress } from '../../../api/queries.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { useErrorLogger } from '../../../hooks/useErrorLogger.ts';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage.tsx';
import { useProfile } from '../useProfile.tsx';
import styles from './AccountAlertsChannelDetails.module.css';
import { VerificationCodeStep } from './VerificationCodeStep.tsx';
import { type Channel, useIsAlreadyVerified, useResendCooldown } from './common.ts';
import { isValidEmail } from './email.ts';
import { isValidCountryCodeInput, isValidPhoneNumber, joinPhone, parsePhone } from './phone.ts';

export interface AccountAlertsChannelDetailsProps {
  channel: Channel;
  notificationParty?: NotificationAccountsType | null;
}

export const AccountAlertsChannelDetails = ({ channel, notificationParty }: AccountAlertsChannelDetailsProps) => {
  const { user } = useProfile();
  const queryClient = useQueryClient();
  const { openSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const { logError } = useErrorLogger();
  const isAlreadyVerified = useIsAlreadyVerified();
  const { cooldown, start: startCooldown } = useResendCooldown();
  const isEmail = channel === 'Email';
  const notificationSettings = notificationParty?.notificationSettings;
  const partyUuid = notificationSettings?.partyUuid || notificationParty?.partyUuid || '';
  const isOrganization = notificationParty?.partyType === 'Organization';
  const persistedValue = isEmail ? notificationSettings?.emailAddress : notificationSettings?.phoneNumber;
  const profileFallback = isEmail ? user?.email : user?.phoneNumber;
  const defaultValue = persistedValue || profileFallback || '';
  const initiallyEnabled = !!persistedValue && defaultValue.length > 0;

  const initialPhone = parsePhone(defaultValue);
  const [enabled, setEnabled] = useState<boolean>(initiallyEnabled);
  const [emailValue, setEmailValue] = useState<string>(isEmail ? defaultValue : '');
  const [countryCode, setCountryCode] = useState<string>(initialPhone.countryCode);
  const [phoneNumberPart, setPhoneNumberPart] = useState<string>(initialPhone.phoneNumber);
  const value = isEmail ? emailValue : joinPhone(countryCode, phoneNumberPart);
  const [isInVerificationFlow, setIsInVerificationFlow] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleClose = () => {
    document.activeElement?.closest('dialog')?.close();
  };

  const isValidValue =
    !enabled || (isEmail ? isValidEmail(emailValue) : isValidPhoneNumber(countryCode, phoneNumberPart));
  const isVerified = !!value && isAlreadyVerified(value, channel);
  const isValueDirty = value.trim() !== defaultValue.trim();
  const isDirty = (enabled && isValueDirty) || enabled !== initiallyEnabled;
  const needsVerification = enabled && !!value && !isVerified;

  const hasChangedFromProfile = persistedValue?.trim() !== value.trim();
  const verificationStatus = isEmail
    ? notificationSettings?.emailVerificationStatus
    : notificationSettings?.smsVerificationStatus;
  const allowedToVerify = (verificationStatus === 'Legacy' ? hasChangedFromProfile : true) && isValidValue;

  const invalidateQueries = () => {
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VERIFIED_ADDRESSES] });
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS_FOR_CURRENT_USER] });
  };

  const buildPatch = (next: string | null) => ({
    partyUuid,
    ...(isEmail ? { emailAddress: next } : { phoneNumber: next }),
  });

  const handleSendCode = async () => {
    setIsSending(true);
    setCodeInput('');
    setCodeError('');
    try {
      const result = await sendVerificationCode({ value, type: channel });
      const response = result?.sendVerificationCode;
      if (response?.success || response?.retryAfter) {
        setIsInVerificationFlow(true);
        startCooldown(response.retryAfter ?? undefined);
      } else {
        openSnackbar({
          message: t('profile.account_alerts.snackbar.error'),
          color: 'danger',
        });
      }
    } catch (err) {
      logError(
        err as Error,
        { context: 'AccountAlertsChannelDetails.handleSendCode', channel },
        'Error sending verification code',
      );
      openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmCode = async () => {
    setIsConfirming(true);
    setCodeError('');
    try {
      const result = await verifyAddress({ value, type: channel, verificationCode: codeInput });
      if (result?.verifyAddress?.success) {
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VERIFIED_ADDRESSES] });
        setIsInVerificationFlow(false);
      } else {
        setCodeError(t('profile.verification.code_invalid'));
      }
    } catch (err) {
      logError(
        err as Error,
        { context: 'AccountAlertsChannelDetails.handleConfirmCode', channel },
        'Error confirming verification code',
      );
      openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (needsVerification) return;
    try {
      const result = await updateNotificationsetting(buildPatch(enabled ? value : null));
      if (result?.updateNotificationSetting?.success) {
        invalidateQueries();
        handleClose();
        openSnackbar({ message: t('profile.account_alerts.snackbar.success'), color: 'company' });
      } else {
        openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
      }
    } catch (err) {
      logError(
        err as Error,
        { context: 'AccountAlertsChannelDetails.handleSave', channel, partyUuid },
        'Error updating notification setting',
      );
      openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
    }
  };

  if (isInVerificationFlow) {
    return (
      <VerificationCodeStep
        channel={channel}
        address={value}
        codeInput={codeInput}
        codeError={codeError}
        isConfirming={isConfirming}
        isSending={isSending}
        resendCooldown={cooldown}
        onCodeChange={(v) => {
          setCodeInput(v);
          setCodeError('');
        }}
        onConfirm={handleConfirmCode}
        onResend={handleSendCode}
        onCancel={() => setIsInVerificationFlow(false)}
      />
    );
  }

  return (
    <form onSubmit={handleSave}>
      <Section spacing={6}>
        <Fieldset size="sm">
          <Switch
            label={isEmail ? t('profile.account_alerts.notify_email') : t('profile.account_alerts.notify_sms')}
            name={isEmail ? 'emailAlerts' : 'smsAlerts'}
            value={isEmail ? t('profile.account_alerts.switch_email_value') : 'SMS'}
            checked={enabled}
            onChange={() => setEnabled((prev) => !prev)}
          />
          {enabled && isEmail && (
            <Field>
              <Label size="sm" className={styles.hiddenLabel}>
                {t('profile.account_alerts.email_label')}
              </Label>
              <div className={styles.fieldWrapper}>
                <Input
                  name="email"
                  size="sm"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder={t('profile.account_alerts.email_placeholder')}
                  autoComplete="email"
                />
                {value && isVerified && (
                  <span data-size="sm" className={styles.badgeOverlay}>
                    <Badge color="success">{t('profile.verification.status_verified')}</Badge>
                  </span>
                )}
              </div>
            </Field>
          )}
          {enabled && !isEmail && (
            <Field>
              <Label className={styles.hiddenLabel} size="sm">
                {t('profile.account_alerts.phone_label')}
              </Label>
              <div className={styles.phoneRow}>
                <Input
                  name="countryCode"
                  size="sm"
                  value={countryCode}
                  inputMode="tel"
                  autoComplete="tel-country-code"
                  aria-label={t('profile.account_alerts.country_code_label')}
                  className={styles.countryCodeInput}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === '' || isValidCountryCodeInput(next)) setCountryCode(next || '+');
                  }}
                />
                <div className={`${styles.fieldWrapper} ${styles.phoneNumberInput}`}>
                  <Input
                    name="tel"
                    size="sm"
                    value={phoneNumberPart}
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder={t('profile.account_alerts.phone_placeholder')}
                    aria-label={t('profile.account_alerts.phone_label')}
                    onChange={(e) => setPhoneNumberPart(e.target.value.replace(/\D/g, ''))}
                  />
                  {value && isVerified && (
                    <span data-size="sm" className={styles.badgeOverlay}>
                      <Badge color="success">{t('profile.verification.status_verified')}</Badge>
                    </span>
                  )}
                </div>
              </div>
            </Field>
          )}
        </Fieldset>
        <Typography size="sm">
          <p>
            {t(
              isOrganization
                ? 'profile.notifications.personal_explanation'
                : 'profile.notifications.personal_for_person',
            )}
          </p>
        </Typography>
        {needsVerification && (
          <Typography size="sm">
            <p>{t('profile.account_alerts.new_addresses_must_verify')}</p>
          </Typography>
        )}
        <ButtonGroup>
          {needsVerification && (
            <Button type="button" variant="tinted" onClick={handleSendCode} disabled={isSending || !allowedToVerify}>
              {isEmail ? t('profile.account_alerts.verify_email') : t('profile.account_alerts.verify_sms')}
            </Button>
          )}
          {!needsVerification && isDirty && (
            <Button type="submit" disabled={!isValidValue}>
              {t('profile.account_alerts.save')}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('word.cancel')}
          </Button>
        </ButtonGroup>
      </Section>
    </form>
  );
};
