import { Button, ButtonGroup, Section, TextField, Typography } from '@altinn/altinn-components';
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

  return (
    <Section spacing={4}>
      <TextField
        label={isEmail ? t('profile.account_alerts.email_placeholder') : t('profile.account_alerts.phone_placeholder')}
        value={address}
        readOnly
        size="sm"
      />
      <TextField
        label={t('profile.verification.code_label')}
        value={codeInput}
        onChange={(e) => onCodeChange(e.target.value)}
        placeholder={t('profile.verification.code_placeholder')}
        inputMode="numeric"
        autoComplete="one-time-code"
      />
      <Typography size="sm">
        <p>{isEmail ? t('profile.verification.code_hint_email') : t('profile.verification.code_hint_sms')}</p>
      </Typography>
      {codeError && <Typography size="sm">{codeError}</Typography>}
      <ButtonGroup>
        <Button type="button" variant="tinted" onClick={onConfirm} disabled={isConfirming || !codeInput}>
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
  );
};
