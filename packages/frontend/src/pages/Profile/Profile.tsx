import { Heading, PageBase, SettingsList, Toolbar } from '@altinn/altinn-components';
import { t } from 'i18next';
import { useIsSelfIdentifiedUser } from '../../api/hooks/usePartiesSelectors.ts';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { SettingsType, useSettings } from './useSettings.tsx';

export const Profile = () => {
  const isSelfIdentifiedUser = useIsSelfIdentifiedUser();
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
    disabled: isSelfIdentifiedUser,
  });

  usePageTitle({ baseTitle: t('sidebar.profile') });

  return (
    <PageBase>
      <Heading size="xl">{t('profile.settings.heading')}</Heading>
      <Toolbar
        search={{
          ...settingsSearch,
          placeholder: t('profile.settings.search_placeholder'),
        }}
      />
      {settings.length === 0 && <Heading size="lg">{t('profile.settings.no_results')}</Heading>}
      <SettingsList items={settings} groups={settingsGroups} />
    </PageBase>
  );
};
