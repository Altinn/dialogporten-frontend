import {
  DashboardHeader,
  type DashboardIconProps,
  Divider,
  List,
  PageBase,
  PageNav,
  SettingsItem,
} from '@altinn/altinn-components';
import { formatDisplayName } from '@altinn/altinn-components';
import { BellIcon, CogIcon } from '@navikt/aksel-icons';
import { t } from 'i18next';
import { Link, useLocation } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { pruneSearchQueryParams } from '../Inbox/queryParams.ts';
import { PageRoutes } from '../routes';
import { useProfile } from './useProfile';

export const Profile = () => {
  const { user, isLoading } = useProfile();
  const { search } = useLocation();
  usePageTitle({ baseTitle: t('sidebar.profile') });
  const userDisplayName = formatDisplayName({
    fullName: user?.party?.name ?? '',
    type: 'person',
    reverseNameOrder: true,
  });

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
        icon={
          {
            type: 'person',
            name: userDisplayName,
          } as DashboardIconProps
        }
        title={userDisplayName}
        description={`${t('profile.landing.ssn')} ${user?.party?.person?.ssn}`}
      >
        <List size="sm">
          <SettingsItem
            as={(props) => <Link {...props} to={PageRoutes.notifications + pruneSearchQueryParams(search)} />}
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
            as={(props) => <Link {...props} to={PageRoutes.settings + pruneSearchQueryParams(search)} />}
          />
        </List>
      </DashboardHeader>
    </PageBase>
  );
};
