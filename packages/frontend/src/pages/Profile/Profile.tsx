import { Heading, PageBase, SettingsList, Toolbar } from '@altinn/altinn-components';
import { t } from 'i18next';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { SettingsType, useSettings } from './useSettings.tsx';

export const Profile = () => {
  const { settings, settingsSearch, settingsGroups } = useSettings({
    options: {
      includeGroups: [
        SettingsType.contact,
        SettingsType.profile,
        SettingsType.contactAddresses,
        SettingsType.partySettings,
        SettingsType.partyOverview,
        SettingsType.inboxShortcuts,
        SettingsType.other,
      ],
    },
  });

  usePageTitle({ baseTitle: t('sidebar.profile') });

  return (
    <PageBase>
      <Heading size="xl">{t('profile.settings.heading')}</Heading>
      <Toolbar
        search={{
          ...settingsSearch,
          placeholder: t('inbox.search.placeholder'),
        }}
      />
      {settings.length === 0 && <Heading size="lg">{t('profile.settings.no_results')}</Heading>}
      <SettingsList items={settings} groups={settingsGroups} />
    </PageBase>
  );
};
