import { useEffect, useState } from 'react';
import { useVerifiedAddresses } from '../useVerifiedAddresses.tsx';

export type Channel = 'Email' | 'Sms';

export const useIsAlreadyVerified = () => {
  const { verifiedAddresses } = useVerifiedAddresses();
  return (value: string, type: Channel) =>
    verifiedAddresses.some(
      (a: { value?: string | null; addressType?: string | null } | null) =>
        a?.value === value && a?.addressType === type,
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
