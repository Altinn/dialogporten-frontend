import { Heading, PageBase, SettingsList, Toolbar } from '@altinn/altinn-components';
import type { NotificationSettingsResponse, PartyFieldsFragment } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { useParties } from '../../../api/hooks/useParties.ts';
import { useIsSelfIdentifiedUser } from '../../../api/hooks/usePartiesSelectors.ts';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { useProfile } from '../useProfile';
import { SettingsType, useSettings } from '../useSettings.tsx';

export interface NotificationAccountsType extends PartyFieldsFragment {
  notificationSettings?: NotificationSettingsResponse;
  parentId?: string;
}

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const { isLoading: isLoadingUser } = useProfile();
  const { isLoading: isLoadingParties } = useParties();
  const isSelfIdentifiedUser = useIsSelfIdentifiedUser();

  usePageTitle({ baseTitle: t('sidebar.profile.notifications') });

  const { settingsGroups, settings, settingsSearch } = useSettings({
    isLoading: isLoadingUser || isLoadingParties,
    disabled: isSelfIdentifiedUser,
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

  return (
    <PageBase>
      <Heading size="xl">{t('sidebar.profile.notifications')}</Heading>
      <Toolbar
        search={{
          ...settingsSearch,
          placeholder: t('profile.notifications.search_placeholder'),
        }}
      />
      {settings.length === 0 && <Heading size="lg">{t('profile.settings.no_results')}</Heading>}
      <SettingsList items={settings} groups={settingsGroups} />
    </PageBase>
  );
};
