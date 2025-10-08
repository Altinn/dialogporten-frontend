import { Breadcrumbs, Heading, PageBase, SettingsList, Toolbar } from '@altinn/altinn-components';
import type { NotificationSettingsResponse, PartyFieldsFragment } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import { usePageTitle } from '../../../hooks/usePageTitle';

import { getBreadcrumbs } from '../Settings/Settings.tsx';
import { SettingsType, useSettings } from '../Settings/useSettings.tsx';
import { useProfile } from '../useProfile';

export interface NotificationAccountsType extends PartyFieldsFragment {
  notificationSettings?: NotificationSettingsResponse;
  parentId?: string;
}

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const { isLoading: isLoadingUser } = useProfile();
  const { isLoading: isLoadingParties } = useParties();

  usePageTitle({ baseTitle: t('component.notifications') });

  const { settingsGroups, settings, settingsSearch } = useSettings({
    isLoading: isLoadingUser || isLoadingParties,
    options: {
      excludeGroups: [SettingsType.contact, SettingsType.alerts, SettingsType.profiles, SettingsType.favorites],
    },
  });

  return (
    <PageBase>
      <Breadcrumbs items={getBreadcrumbs(t('sidebar.profile'), t('sidebar.profile.notifications'), search)} />
      <Heading size="xl">{t('sidebar.profile.notifications')}</Heading>
      <Toolbar
        search={{
          ...settingsSearch,
          placeholder: t('parties.search.placeholder'),
        }}
      />
      <SettingsList items={settings} groups={settingsGroups} />
    </PageBase>
  );
};
