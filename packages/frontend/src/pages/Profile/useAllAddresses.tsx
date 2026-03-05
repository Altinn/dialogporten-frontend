import { useMemo } from 'react';
import { useNotificationSettingsForCurrentUser } from './useNotificationSettings.tsx';
import { useVerifiedAddresses } from './useVerifiedAddresses.tsx';

export type AddressType = 'Email' | 'Sms';
export type VerificationStatus = 'Unverified' | 'Verified' | 'Legacy';

export interface MergedAddress {
  value: string;
  type: AddressType;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  partyUuid?: string;
}

export const useAllAddresses = () => {
  const { notificationSettingsForCurrentUser, isLoading: isLoadingSettings } = useNotificationSettingsForCurrentUser();
  const { verifiedAddresses } = useVerifiedAddresses();

  const allAddresses = useMemo<MergedAddress[]>(() => {
    const activeAddresses: MergedAddress[] = [];

    for (const setting of notificationSettingsForCurrentUser) {
      if (!setting) continue;
      const partyUuid = setting.partyUuid ?? undefined;

      if (setting.emailAddress) {
        activeAddresses.push({
          value: setting.emailAddress,
          type: 'Email',
          verificationStatus: (setting.emailVerificationStatus ?? 'Unverified') as VerificationStatus,
          isActive: true,
          partyUuid,
        });
      }

      if (setting.phoneNumber) {
        activeAddresses.push({
          value: setting.phoneNumber,
          type: 'Sms',
          verificationStatus: (setting.smsVerificationStatus ?? 'Unverified') as VerificationStatus,
          isActive: true,
          partyUuid,
        });
      }
    }

    const activeValues = new Set(activeAddresses.map((a) => a.value));

    const inactiveAddresses: MergedAddress[] = (verifiedAddresses ?? [])
      .filter((addr) => addr?.value && !activeValues.has(addr.value))
      .map((addr) => ({
        value: addr!.value!,
        type: (addr!.addressType ?? 'Email') as AddressType,
        verificationStatus: 'Verified' as VerificationStatus,
        isActive: false,
      }));

    return [...activeAddresses, ...inactiveAddresses];
  }, [notificationSettingsForCurrentUser, verifiedAddresses]);

  return {
    allAddresses,
    isLoading: isLoadingSettings,
  };
};
