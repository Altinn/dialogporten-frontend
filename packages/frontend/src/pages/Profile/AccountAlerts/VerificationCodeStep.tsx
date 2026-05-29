import {
  Button,
  ButtonGroup,
  Field,
  Input,
  Label,
  Section,
  TextField,
  Typography,
  DsValidationMessage as ValidationMessage,
} from '@altinn/altinn-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Channel } from './common.ts';

interface VerificationCodeStepProps {
  channel: Channel;
  address: string;
  codeInput: string;
  codeError: string;
  isConfirming: boolean;
  isSending: boolean;
  resendCooldown: number;
  onCodeChange: (value: string) => void;
  onConfirm: () => void;
  onResend: () => void;
  onCancel: () => void;
}

const CODE_LENGTH = 6;

export const VerificationCodeStep = ({
  channel,
  address,
  codeInput,
  codeError,
  isConfirming,
  isSending,
  resendCooldown,
  onCodeChange,
  onConfirm,
  onResend,
  onCancel,
}: VerificationCodeStepProps) => {
  const { t } = useTranslation();
  const isEmail = channel === 'Email';
  const [codeTouched, setCodeTouched] = useState<boolean>(false);

  const isCodeComplete = new RegExp(`^\\d{${CODE_LENGTH}}$`).test(codeInput);
  const codeValidation = codeError
    ? { color: 'danger' as const, message: codeError }
    : !codeInput || !codeTouched
      ? { color: 'info' as const, message: t('profile.verification.code_hint') }
      : isCodeComplete
        ? { color: 'success' as const, message: t('profile.verification.code_valid') }
        : { color: 'danger' as const, message: t('profile.verification.code_length_invalid') };

  const handleConfirm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isCodeComplete) {
      setCodeTouched(true);
      e.currentTarget.querySelector<HTMLInputElement>('input[name="verificationCode"]')?.focus();
      return;
    }
    onConfirm();
  };

  return (
    <form onSubmit={handleConfirm}>
      <Section spacing={4}>
        <TextField
          label={
            isEmail ? t('profile.account_alerts.email_placeholder') : t('profile.account_alerts.phone_placeholder')
          }
          value={address}
          readOnly
          size="sm"
        />
        <Field>
          <Label size="sm">{t('profile.verification.code_label')}</Label>
          <Input
            name="verificationCode"
            size="sm"
            value={codeInput}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            placeholder={t('profile.verification.code_placeholder')}
            aria-invalid={codeValidation.color === 'danger'}
            onChange={(e) => {
              onCodeChange(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH));
              setCodeTouched(false);
            }}
            onBlur={() => setCodeTouched(true)}
          />
          <ValidationMessage data-size="sm" data-color={codeValidation.color}>
            {codeValidation.message}
          </ValidationMessage>
        </Field>
        <Typography size="sm">
          <p>{isEmail ? t('profile.verification.code_hint_email') : t('profile.verification.code_hint_sms')}</p>
        </Typography>
        <ButtonGroup>
          <Button type="submit" variant="tinted" disabled={isConfirming}>
            {t('profile.verification.confirm_button')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onResend}
            disabled={isSending || resendCooldown > 0}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {resendCooldown > 0
              ? t('profile.verification.resend_code_cooldown', { seconds: String(resendCooldown).padStart(2, '0') })
              : t('profile.verification.resend_code')}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('profile.account_alerts.cancel')}
          </Button>
        </ButtonGroup>
      </Section>
    </form>
  );
};
