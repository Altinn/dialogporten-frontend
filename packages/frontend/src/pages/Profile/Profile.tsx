import { DashboardHeader, PageBase, SettingsList } from '@altinn/altinn-components';
import { formatDisplayName } from '@altinn/altinn-components';
import { t } from 'i18next';
import { formatSSN } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { useFeatureFlag } from '../../featureFlags';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { useProfileOnboarding } from '../../onboardingTour/useProfileOnboarding';
import { SettingsType, useSettings } from './Settings/useSettings.tsx';
import { useProfile } from './useProfile';

export const Profile = () => {
  const { user, isLoading } = useProfile();
  const stopReversingPersonNameOrder = useFeatureFlag<boolean>('party.stopReversingPersonNameOrder');
  const { settings } = useSettings({
    options: {
      includeGroups: [SettingsType.contact],
    },
  });

  usePageTitle({ baseTitle: t('sidebar.profile') });
  useProfileOnboarding({ isLoading, pageType: 'main' });

  const userDisplayName = formatDisplayName({
    fullName: user?.party?.name ?? '',
    type: 'person',
    reverseNameOrder: !stopReversingPersonNameOrder,
  });

  return (
    <PageBase>
      <DashboardHeader
        loading={isLoading}
        icon={{
          type: 'person',
          name: userDisplayName,
        }}
        title={userDisplayName}
        description={`${t('profile.landing.ssn')} ${user?.party?.ssn ? formatSSN(user?.party?.ssn, false) : ''}`}
      />
      <SettingsList items={settings} />
    </PageBase>
  );
};
