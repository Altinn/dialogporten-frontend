import { useSnackbar } from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendVerificationCode, verifyAddress } from '../../../api/queries.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { useVerifiedAddresses } from '../useVerifiedAddresses.tsx';

export type Channel = 'Email' | 'Sms';

export const useIsAlreadyVerified = () => {
  const { verifiedAddresses } = useVerifiedAddresses();
  return (value: string, type: Channel) =>
    verifiedAddresses.some(
      (a: { value?: string | null; addressType?: string | null } | null) =>
        a?.value?.toLowerCase() === value?.toLowerCase() && a?.addressType === type,
    );
};

export const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

export const useResendCooldown = () => {
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return {
    cooldown,
    start: (seconds: number = DEFAULT_RESEND_COOLDOWN_SECONDS) => setCooldown(Math.max(0, seconds)),
    reset: () => setCooldown(0),
  };
};

export const useVerificationFlow = (channel: Channel) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { openSnackbar } = useSnackbar();
  const { cooldown, start: startCooldown } = useResendCooldown();

  const [isInVerificationFlow, setIsInVerificationFlow] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSendCode = async (value: string) => {
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
        openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
      }
    } catch {
      openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmCode = async (value: string) => {
    setIsConfirming(true);
    setCodeError('');
    try {
      const result = await verifyAddress({ value, type: channel, verificationCode: codeInput });
      if (result?.verifyAddress?.success) {
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VERIFIED_ADDRESSES] });
        setIsInVerificationFlow(false);
      } else {
        setCodeError(t('profile.verification.code_invalid'));
      }
    } catch {
      openSnackbar({ message: t('profile.account_alerts.snackbar.error'), color: 'danger' });
    } finally {
      setIsConfirming(false);
    }
  };

  return {
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
  };
};
