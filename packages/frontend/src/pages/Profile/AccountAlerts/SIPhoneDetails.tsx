import {
  Badge,
  Button,
  ButtonGroup,
  Field,
  Input,
  Label,
  Section,
  Typography,
  useSnackbar,
} from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateSIPrivatePhoneNumber } from '../../../api/queries.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import styles from './AccountAlertsChannelDetails.module.css';
import { VerificationCodeStep } from './VerificationCodeStep.tsx';
import { useIsAlreadyVerified, useVerificationFlow } from './common.ts';
import { isValidCountryCodeInput, isValidPhoneNumber, joinPhone, parsePhone } from './phone.ts';

export const SIPhoneDetails = ({ phoneNumber }: { phoneNumber?: string }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { openSnackbar } = useSnackbar();
  const isAlreadyVerified = useIsAlreadyVerified();
  const {
    isInVerificationFlow,
    setIsInVerificationFlow,
    codeInput,
    setCodeInput,
    codeError,
    setCodeError,
    isSending,
    isConfirming,
    cooldown,
    handleSendCode,
    handleConfirmCode,
  } = useVerificationFlow('Sms');

  const initialPhone = parsePhone(phoneNumber);
  const [countryCode, setCountryCode] = useState<string>(initialPhone.countryCode);
  const [phoneNumberPart, setPhoneNumberPart] = useState<string>(initialPhone.phoneNumber);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = (event: React.SyntheticEvent) => {
    const target = event.target as Element | null;
    target?.closest('dialog')?.close();
  };

  const siPhoneValue = joinPhone(countryCode, phoneNumberPart);
  const isPhoneShapeValid = isValidPhoneNumber(countryCode, phoneNumberPart);
  const isVerified = !!siPhoneValue && isAlreadyVerified(siPhoneValue, 'Sms');
  const isValueDirty = siPhoneValue.trim() !== (phoneNumber ?? '').trim();
  const needsVerification = !!siPhoneValue && !isVerified;

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (needsVerification) return;
    setIsSaving(true);
    try {
      const result = await updateSIPrivatePhoneNumber(siPhoneValue || null);
      if (result?.updateSIPrivatePhoneNumber?.success) {
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
        handleClose(e);
        openSnackbar({ message: t('profile.account_alerts.snackbar.success'), color: 'company' });
      } else {
        openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
      }
    } catch {
      openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isInVerificationFlow) {
    return (
      <VerificationCodeStep
        channel="Sms"
        address={siPhoneValue}
        codeInput={codeInput}
        codeError={codeError}
        isConfirming={isConfirming}
        isSending={isSending}
        resendCooldown={cooldown}
        onCodeChange={(v) => {
          setCodeInput(v);
          setCodeError('');
        }}
        onConfirm={() => handleConfirmCode(siPhoneValue)}
        onResend={() => handleSendCode(siPhoneValue)}
        onCancel={() => setIsInVerificationFlow(false)}
      />
    );
  }

  return (
    <form onSubmit={handleSave}>
      <Section spacing={6}>
        <Field>
          <Label size="sm">{t('profile.account_alerts.phone_label')}</Label>
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
              {siPhoneValue && isVerified && (
                <span data-size="sm" className={styles.badgeOverlay}>
                  <Badge color="success">{t('profile.verification.status_verified')}</Badge>
                </span>
              )}
            </div>
          </div>
        </Field>
        {needsVerification && siPhoneValue && (
          <Typography size="sm">
            <p>{t('profile.account_alerts.new_addresses_must_verify')}</p>
          </Typography>
        )}
        <ButtonGroup>
          {needsVerification && siPhoneValue && (
            <Button
              type="button"
              variant="tinted"
              onClick={() => handleSendCode(siPhoneValue)}
              disabled={isSending || !isPhoneShapeValid}
            >
              {t('profile.account_alerts.verify_sms')}
            </Button>
          )}
          {!needsVerification && isValueDirty && (
            <Button type="submit" disabled={!isPhoneShapeValid || isSaving}>
              {t('profile.account_alerts.save')}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('word.close')}
          </Button>
        </ButtonGroup>
      </Section>
    </form>
  );
};
