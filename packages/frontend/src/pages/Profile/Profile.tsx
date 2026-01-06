import { DashboardHeader, PageBase, SettingsList } from '@altinn/altinn-components';
import { formatDisplayName } from '@altinn/altinn-components';
import { t } from 'i18next';
import { formatSSN } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { useProfileOnboarding } from '../../onboardingTour/useProfileOnboarding';
import { SettingsType, useSettings } from './Settings/useSettings.tsx';
import { useProfile } from './useProfile';

export const Profile = () => {
  const { user, isLoading } = useProfile();
  const { settings } = useSettings({
    options: {
      includeGroups: [SettingsType.contact],
    },
  });

  usePageTitle({ baseTitle: t('sidebar.profile') });
  useProfileOnboarding({ isLoading, pageType: 'main' });

  const userDisplayName = formatDisplayName({
    fullName: [user?.party?.person?.firstName, user?.party?.person?.middleName, user?.party?.person?.lastName]
      .filter(Boolean)
      .join(' '),
    type: 'person',
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
