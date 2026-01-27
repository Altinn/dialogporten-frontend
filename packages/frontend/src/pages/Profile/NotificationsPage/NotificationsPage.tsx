import { Breadcrumbs, Heading, ListItemLabel, PageBase, SettingsList, Toolbar } from '@altinn/altinn-components';
import type { NotificationSettingsResponse, PartyFieldsFragment } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import { getNotificationSettingsLink } from '../../../auth';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { getBreadcrumbs } from '../Settings/Settings.tsx';
import { SettingsType, useSettings } from '../Settings/useSettings.tsx';
import { useProfile } from '../useProfile';
import styles from './notificationsPage.module.css';
export interface NotificationAccountsType extends PartyFieldsFragment {
  notificationSettings?: NotificationSettingsResponse;
  parentId?: string;
}

export const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const { search } = useLocation();
  const { isLoading: isLoadingUser } = useProfile();
  const { isLoading: isLoadingParties } = useParties();
  const notificationSettingsUrl = getNotificationSettingsLink(i18n.language);

  usePageTitle({ baseTitle: t('component.notifications') });

  const companiesTitle = (
    <div className={styles.companiesTitle}>
      <ListItemLabel title={t('profile.settings.company_notifications')}>
        {t('profile.settings.company_notifications')}
      </ListItemLabel>
      <span className={styles.infoText}>
        <a className={styles.link} href={notificationSettingsUrl}>
          {t('profile.settings.where_individual_services_notifications')}
        </a>
      </span>
    </div>
  );

  const { settingsGroups, settings, settingsSearch } = useSettings({
    isLoading: isLoadingUser || isLoadingParties,
    options: {
      excludeGroups: [SettingsType.contact, SettingsType.primary, SettingsType.favorites],
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
          title: companiesTitle,
        },
      },
    },
  });

  return (
    <PageBase>
      <Breadcrumbs items={getBreadcrumbs(t('sidebar.profile'), t('sidebar.profile.notifications'), search)} />
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
