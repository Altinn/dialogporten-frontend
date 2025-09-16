import {
  Divider,
  Heading,
  List,
  PageBase,
  PageNav,
  SettingsItem,
  SettingsSection,
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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import { usePageTitle } from '../../../utils/usePageTitle';
import { PageRoutes } from '../../routes';
import { flattenParties } from '../PartiesOverviewPage/partyFieldToNotificationsList';
import { buildAddressString } from '../buildAddressString';

export const Settings = () => {
  const { user } = useProfile();
  const { parties: normalParties } = useParties();
  const flattenedParties = flattenParties(normalParties);
  const flattenedPartiesCount = flattenedParties?.filter((party) => party.partyType === 'Organization')?.length || 0;

  const [expandedElement, setExpandedElement] = useState<boolean>(false);

  const { t } = useTranslation();
  usePageTitle({ baseTitle: t('component.settings') });

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
      <SettingsSection>
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
      </SettingsSection>
      <Heading size="xl">{t('profile.settings.more_contact_settings')}</Heading>
      <SettingsSection>
        <List>
          <SettingsItem
            as={(props) => <Link to={PageRoutes.notifications} {...props} />}
            icon={BellIcon}
            title={t('profile.settings.notification_settings')}
            badge={!!flattenedPartiesCount && { label: `${flattenedPartiesCount} aktører` }}
            linkIcon
          />
          <Divider as="li" />
          <SettingsItem
            icon={PersonRectangleIcon}
            title={t('profile.settings.contact_profiles')}
            badge={{ label: 'x antall profiler' }}
            linkIcon
          />
          <Divider as="li" />
          <SettingsItem as="button" icon={SunIcon} title="Modus: Lys" linkIcon />
          <Divider />
          <SettingsItem
            as="button"
            icon={GlobeIcon}
            title="Språk/language:"
            linkIcon
            onClick={() => setExpandedElement(!expandedElement)}
            expanded={expandedElement}
          >
            <p>Some content here</p>
          </SettingsItem>
        </List>
      </SettingsSection>
    </PageBase>
  );
};
