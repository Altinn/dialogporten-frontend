import { useMemo } from 'react';
import { useFeatureFlag } from '../../../featureFlags/useFeatureFlag';
import { useProfile } from '../../../pages/Profile';
import { SettingsType } from '../../../pages/Profile/Settings/useSettings';
import type { PartyItemProp } from './useAccounts';

interface UseFilteredAccountsProps {
  accounts: PartyItemProp[];
}

interface UseFilteredAccountsOutput {
  filteredAccounts: PartyItemProp[];
}

/**
 * Hook to filter deleted parties from account lists based on user preferences.
 *
 * Filtering rules:
 * 1. When feature flag `inbox.enableDeletedUnitsFilter` is disabled → show all parties (backward compatibility)
 * 2. When feature flag is enabled and user preference is false → hide deleted parties EXCEPT:
 *    - Favorites (groupId === SettingsType.favorites)
 *    - Primary account (groupId === 'primary')
 * 3. When feature flag is enabled and user preference is true → show all parties
 */
export const useFilteredAccounts = ({ accounts }: UseFilteredAccountsProps): UseFilteredAccountsOutput => {
  const isDeletedUnitsFilterEnabled = useFeatureFlag<boolean>('inbox.enableDeletedUnitsFilter');
  const { shouldShowDeletedEntities } = useProfile();

  const includeDeletedParties = isDeletedUnitsFilterEnabled ? (shouldShowDeletedEntities ?? false) : true;

  const filteredAccounts = useMemo(() => {
    if (includeDeletedParties) {
      return accounts;
    }

    return accounts.filter((item) => {
      // Always show favorites and primary account
      if (item.groupId === SettingsType.favorites || item.groupId === 'primary') {
        return true;
      }
      // Filter out deleted parties
      return !item.isDeleted;
    });
  }, [accounts, includeDeletedParties]);

  return { filteredAccounts };
};
