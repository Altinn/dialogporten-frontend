import { Button, DashboardHeader, DsHeading, Flex, PageBase, PageNav, Typography } from '@altinn/altinn-components';
import { t } from 'i18next';
import { useProfile } from '../../../profile';
import { buildAddressString } from '../../../profile/buildAddressString';
import { PageRoutes } from '../../routes';
import styles from '../profile.module.css';

export const Settings = () => {
  const { user, isLoading } = useProfile();

  const userName = user?.party?.person?.name;
  const heading = userName ? `${t('profile.settings.heading')} ${userName}` : t('sidebar.profile.settings');

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
      <DsHeading>{heading}</DsHeading>

      <DashboardHeader name={userName ? userName : ''} loading={isLoading}>
        <Flex className={styles.contactInfoFlex} direction="col">
          <Typography className={styles.contactInfo}>
            <h6>{t('profile.landing.email')}</h6>
            <p>{user?.email || ' - '}</p>
          </Typography>
          <Typography className={styles.contactInfo}>
            <h6>{t('profile.landing.phone')}</h6>
            <p>{user?.party?.person?.mobileNumber || '-'}</p>
          </Typography>
          <Typography className={styles.contactInfo}>
            <h6>{t('profile.landing.address')}</h6>
            <p>{buildAddressString(user?.party?.person)}</p>
            <Button variant="outline" size="sm" onClick={() => {}}>
              {t('profile.landing.change.address')}
            </Button>
          </Typography>
        </Flex>
      </DashboardHeader>
    </PageBase>
  );
};
