import { Heading, PageBase, SettingsList, Toolbar } from '@altinn/altinn-components';
import { useTranslation } from 'react-i18next';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { SettingsType, useSettings } from './useSettings.tsx';

export const Settings = () => {
  const { t } = useTranslation();
  const { isLoading: isLoadingUser } = useProfile();
  const { isLoading: isLoadingParties, isSelfIdentifiedUser } = useParties();

  usePageTitle({ baseTitle: t('component.settings') });

  const { settingsGroups, settings, settingsSearch } = useSettings({
    isLoading: isLoadingUser || isLoadingParties,
    isSelfIdentifiedUser,
    disabled: isSelfIdentifiedUser,
    options: {
      includeGroups: [SettingsType.contact],
    },
  });

  return (
    <PageBase>
      <Heading size="xl">{t('profile.settings.personal_settings')}</Heading>
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
