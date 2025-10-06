import { DashboardHeader, type DashboardIconProps, PageBase, SettingsList } from '@altinn/altinn-components';
import { formatDisplayName } from '@altinn/altinn-components';
import { CogIcon } from '@navikt/aksel-icons';
import { t } from 'i18next';
import { Link, type LinkProps, useLocation } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { useProfileOnboarding } from '../../onboardingTour/useProfileOnboarding';
import { pruneSearchQueryParams } from '../Inbox/queryParams.ts';
import { PageRoutes } from '../routes';
import { SettingsType, useSettings } from './Settings/useSettings.tsx';
import { useProfile } from './useProfile';

export const Profile = () => {
  const { user, isLoading } = useProfile();
  const { search } = useLocation();
  const { settings } = useSettings({
    options: {
      includeGroups: [SettingsType.alerts],
    },
  });

  usePageTitle({ baseTitle: t('sidebar.profile') });
  useProfileOnboarding({ isLoading, pageType: 'main' });

  const allSettings = [
    ...settings,
    {
      id: 'more-settings',
      icon: CogIcon,
      title: t('profile.landing.more_settings'),
      linkIcon: true,
      as: (props: LinkProps) => <Link {...props} to={PageRoutes.settings + pruneSearchQueryParams(search)} />,
    },
  ];

  const userDisplayName = formatDisplayName({
    fullName: user?.party?.name ?? '',
    type: 'person',
    reverseNameOrder: true,
  });

  return (
    <PageBase>
      <DashboardHeader
        loading={isLoading}
        icon={
          {
            type: 'person',
            name: userDisplayName,
          } as DashboardIconProps
        }
        title={userDisplayName}
        description={`${t('profile.landing.ssn')} ${user?.party?.person?.ssn}`}
      />
      <SettingsList items={allSettings} />
    </PageBase>
  );
};
