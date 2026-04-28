import { Heading, ListItemLabel, PageBase, SettingsList, Toolbar } from '@altinn/altinn-components';
import type { NotificationSettingsResponse, PartyFieldsFragment } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { useParties } from '../../../api/hooks/useParties.ts';
import { useIsSelfIdentifiedUser } from '../../../api/hooks/usePartiesSelectors.ts';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { SettingsType, useSettings } from '../Settings/useSettings.tsx';
import { useProfile } from '../useProfile';

export interface NotificationAccountsType extends PartyFieldsFragment {
  notificationSettings?: NotificationSettingsResponse;
  parentId?: string;
}

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const { isLoading: isLoadingUser } = useProfile();
  const { isLoading: isLoadingParties } = useParties();
  const isSelfIdentifiedUser = useIsSelfIdentifiedUser();

  usePageTitle({ baseTitle: t('component.notifications') });

  const { settingsGroups, settings, settingsSearch } = useSettings({
    isLoading: isLoadingUser || isLoadingParties,
    isSelfIdentifiedUser,
    disabled: isSelfIdentifiedUser,
    options: {
      excludeGroups: [SettingsType.contact, SettingsType.primary, SettingsType.favorites, SettingsType.other],
      groups: {
        [SettingsType.alerts]: {
          title: t('profile.settings.notification_addresses'),
        },
        [SettingsType.profiles]: {
          title: t('profile.settings.notification_profiles'),
        },
        [SettingsType.persons]: {
          title: t('profile.settings.person_notifications'),
        },
        [SettingsType.companies]: {
          title: (
            <ListItemLabel title={t('profile.settings.company_notifications')}>
              {t('profile.settings.company_notifications')}
            </ListItemLabel>
          ),
        },
      },
    },
  });

  return (
    <PageBase>
      <Heading size="xl">{t('profile.settings.notification_settings')}</Heading>
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
