import {
  Divider,
  Heading,
  List,
  LocaleSwitcher,
  PageBase,
  PageNav,
  SettingsItem,
  Settings as SettingsWrapper,
  Typography,
} from '@altinn/altinn-components';
import {
  BellIcon,
  GlobeIcon,
  HouseHeartIcon,
  MobileIcon,
  PaperplaneIcon,
  PersonRectangleIcon,
  SunIcon,
} from '@navikt/aksel-icons';
import { t } from 'i18next';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateLanguage } from '../../../api/queries';
import { i18n } from '../../../i18n/config';
import { useProfile } from '../../../profile';
import { buildAddressString } from '../../../profile/buildAddressString';
import { PageRoutes } from '../../routes';

export const Settings = () => {
  const { user } = useProfile();

  const [expandedElement, setExpandedElement] = useState<boolean>(false);

  const handleUpdateLanguage = async (language: string) => {
    try {
      await updateLanguage(language);
    } catch (error) {
      console.error('Failed to delete saved search:', error);
    } finally {
      i18n.changeLanguage(language);
    }
  };

  return (
    <PageBase>
      <PageNav
        breadcrumbs={[
          {
            label: t('word.frontpage'),
            href: PageRoutes.inbox,
          },
          {
            label: t('sidebar.profile'),
            href: PageRoutes.profile,
          },
          {
            label: t('sidebar.profile.settings'),
            href: PageRoutes.settings,
          },
        ]}
      />

      <Heading size="xl">{t('profile.settings.contact_settings')}</Heading>
      <SettingsWrapper>
        <List size="sm">
          <SettingsItem
            icon={{ svgElement: PaperplaneIcon }}
            title={t('profile.settings.main_email')}
            value={user?.email || '-'}
            badge={<Typography size="xs">{t('profile.settings.change_in_register_centre')}</Typography>}
            linkIcon
          />
          <Divider />
          <SettingsItem
            icon={{ svgElement: MobileIcon }}
            title={t('profile.settings.sms_notifications')}
            value={user?.party?.person?.mobileNumber || '-'}
            badge={<Typography size="xs">{t('profile.settings.change_in_register_centre')}</Typography>}
            linkIcon
          />
          <Divider />
          <SettingsItem
            icon={{ svgElement: HouseHeartIcon }}
            title={t('profile.settings.postal_address')}
            value={buildAddressString(user?.party?.person) || '-'}
            badge={<Typography size="xs">{t('profile.settings.change_in_population_register')}</Typography>}
            linkIcon
          />
        </List>
      </SettingsWrapper>
      <Heading size="xl">{t('profile.settings.more_contact_settings')}</Heading>
      <SettingsWrapper>
        <List>
          <SettingsItem
            as={(props) => <Link to={PageRoutes.notifications} {...props} />}
            icon={BellIcon}
            title={t('profile.settings.notification_settings')}
            badge={{ label: '12 aktører' }}
            linkIcon
          />
          <Divider as="li" />
          <SettingsItem
            icon={PersonRectangleIcon}
            title={t('profile.settings.contact_profiles')}
            badge={{ label: '3 profiler' }}
            linkIcon
          />
          <Divider as="li" />
          <SettingsItem icon={SunIcon} title="Modus: Lys" linkIcon />
          <Divider />
          <SettingsItem
            icon={GlobeIcon}
            title="Språk/language: Bokmål"
            linkIcon
            onClick={() => setExpandedElement(!expandedElement)}
            expanded={expandedElement}
          >
            <LocaleSwitcher
              onChange={(e) => handleUpdateLanguage((e.target as HTMLSelectElement).value)}
              options={[
                { label: 'Norsk Bokmål', value: 'nb', checked: i18n.language === 'nb' },
                { label: 'Norsk Nynorsk', value: 'nn', checked: i18n.language === 'nn' },
                { label: 'English', value: 'en', checked: i18n.language === 'en' },
              ]}
            />
          </SettingsItem>
        </List>
      </SettingsWrapper>
    </PageBase>
  );
};
