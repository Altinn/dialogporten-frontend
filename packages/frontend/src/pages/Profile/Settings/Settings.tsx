import { Breadcrumbs, Heading, PageBase, SettingsList, Toolbar } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation } from 'react-router-dom';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { pruneSearchQueryParams } from '../../Inbox/queryParams.ts';
import { PageRoutes } from '../../routes';
import { SettingsType, useSettings } from './useSettings.tsx';

export const getBreadcrumbs = (homeLabel: string, currentStepLabel: string, search: string) => {
  return [
    {
      label: homeLabel,
      as: (props: LinkProps) => <Link {...props} to={PageRoutes.profile + pruneSearchQueryParams(search)} />,
    },
    {
      label: currentStepLabel,
      href: PageRoutes.partiesOverview,
    },
  ];
};

export const Settings = () => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const { isLoading: isLoadingUser } = useProfile();
  const { isLoading: isLoadingParties } = useParties();

  usePageTitle({ baseTitle: t('component.settings') });

  const { settingsGroups, settings, settingsSearch } = useSettings({
    isLoading: isLoadingUser || isLoadingParties,
    options: {
      includeGroups: [SettingsType.contact],
    },
  });

  return (
    <PageBase>
      <Breadcrumbs items={getBreadcrumbs(t('sidebar.profile'), t('sidebar.profile.settings'), search)} />
      <Heading size="xl">Personlige innstillinger</Heading>
      <Toolbar
        search={{
          ...settingsSearch,
          placeholder: 'Søk i innstillinger',
        }}
      />
      {settings.length === 0 && <Heading size="lg">Ingen treff</Heading>}
      <SettingsList items={settings} groups={settingsGroups} />
    </PageBase>
  );
};
