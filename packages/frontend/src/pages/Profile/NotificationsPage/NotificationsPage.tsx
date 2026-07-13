import { Heading, PageBase, SettingsList, Toolbar } from '@altinn/altinn-components';
import type { NotificationSettingsResponse, PartyFieldsFragment } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import { hasOnlySelfParty } from '../../../api/hooks/usePartiesSelectors.ts';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { PageRoutes } from '../../routes.ts';
import { useProfile } from '../useProfile';
import { SettingsType, useSettings } from '../useSettings.tsx';

export interface NotificationAccountsType extends PartyFieldsFragment {
  notificationSettings?: NotificationSettingsResponse;
  parentId?: string;
}

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const { isLoading: isLoadingUser } = useProfile();
  const { isLoading: isLoadingParties, parties } = useParties();

  usePageTitle({ baseTitle: t('sidebar.profile.notifications') });

  const { settingsGroups, settings, settingsSearch } = useSettings({
    isLoading: isLoadingUser || isLoadingParties,
    options: {
      includeGroups: [
        SettingsType.mobileAlerts,
        SettingsType.emailAlerts,
        SettingsType.mobileProfile,
        SettingsType.emailProfiles,
      ],
      groups: {
        [SettingsType.mobileAlerts]: {
          title: t('profile.settings.sms_notifications'),
        },
        [SettingsType.emailAlerts]: {
          title: t('profile.settings.email_notifications'),
        },
        [SettingsType.alerts]: {
          title: t('profile.settings.notification_addresses'),
        },
      },
    },
  });

  if (!isLoadingParties && hasOnlySelfParty(parties)) {
    return <Navigate to={PageRoutes.profile} replace />;
  }

  return (
    <PageBase>
      <Heading as="h1" size="xl">
        {t('sidebar.profile.notifications')}
      </Heading>
      <Toolbar
        search={{
          ...settingsSearch,
          placeholder: t('inbox.search.placeholder'),
        }}
      />
      {settings.length === 0 && (
        <Heading as="h2" size="lg">
          {t('profile.settings.no_results')}
        </Heading>
      )}
      <SettingsList items={settings} groups={settingsGroups} />
    </PageBase>
  );
};
