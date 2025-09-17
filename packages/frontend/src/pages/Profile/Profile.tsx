import { DashboardHeader, Divider, List, PageBase, PageNav, SettingsItem } from '@altinn/altinn-components';
import { BellIcon, CogIcon } from '@navikt/aksel-icons';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { PageRoutes } from '../routes';
import { toTitleCase } from './name';
import { useProfile } from './useProfile';

export const Profile = () => {
  const { user, isLoading } = useProfile();

  usePageTitle({ baseTitle: t('sidebar.profile') });

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
        ]}
      />

      <DashboardHeader
        loading={isLoading}
        type="person"
        name={toTitleCase(user?.party?.name) || ''}
        description={`${t('profile.landing.ssn')} ${user?.party?.person?.ssn}`}
      >
        <List size="sm">
          <SettingsItem
            as={(props) => <Link {...props} to={PageRoutes.notifications} />}
            icon={BellIcon}
            title={t('profile.notifications.are_on')}
            description="Alle varslinger"
            badge={{ label: 'SMS og Epost' }}
            linkIcon
          />
          <Divider as="li" />
          <SettingsItem
            icon={CogIcon}
            title={t('profile.landing.more_settings')}
            linkIcon
            as={(props) => <Link {...props} to={PageRoutes.settings} />}
          />
        </List>
      </DashboardHeader>
    </PageBase>
  );
};
