import {
  Divider,
  Heading,
  List,
  PageBase,
  PageNav,
  Section,
  SettingsItem,
  SettingsSection,
} from '@altinn/altinn-components';
import { MobileIcon, PaperplaneIcon } from '@navikt/aksel-icons';
import { useTranslation } from 'react-i18next';
import { getBreadcrumbs } from '../PartiesOverviewPage/partyFieldToAccountList';
import { useProfile } from '../useProfile';
import { AccountSettings } from './AccountSettings';

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const { user } = useProfile();
  const userHasNotificationsActivated =
    (!!user?.email?.length && user?.email?.length > 0) ||
    (!!user?.phoneNumber?.length && user?.phoneNumber?.length > 0);

  return (
    <PageBase>
      <PageNav breadcrumbs={getBreadcrumbs(user?.party?.name || '')} />
      <Heading size="xl">{t('profile.notifications.heading')}</Heading>

      <Section spacing={6}>
        <SettingsSection>
          <List>
            {userHasNotificationsActivated && (
              <>
                <SettingsItem
                  icon={{ svgElement: MobileIcon, theme: 'default' }}
                  title={t('profile.settings.sms_notifications')}
                  value={user?.phoneNumber || 'Ingen telefonnummer registrert'}
                  badge={<span data-size="xs">{t('profile.notifications.change_phone')}</span>}
                  linkIcon
                />
                <Divider as="li" />
                <SettingsItem
                  icon={{ svgElement: PaperplaneIcon, theme: 'default' }}
                  title={t('profile.notifications.email_for_alerts')}
                  value={user?.email || ''}
                  badge={<span data-size="xs">{t('profile.notifications.change_email')}</span>}
                  linkIcon
                />
              </>
            )}
          </List>
        </SettingsSection>
        {userHasNotificationsActivated && <Heading size="lg">{t('profile.notifications.heading_per_actor')}</Heading>}
        <AccountSettings />
      </Section>
    </PageBase>
  );
};
