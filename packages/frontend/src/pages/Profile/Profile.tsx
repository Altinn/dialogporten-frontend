import { Button, DashboardHeader, Flex, PageBase, PageNav, Typography } from '@altinn/altinn-components';
import { t } from 'i18next';
import { useProfile } from '../../profile';
import { PageRoutes } from '../routes';
import styles from './profile.module.css';

export const Profile = () => {
  const { user, isLoading } = useProfile();

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
        name={user?.party?.person?.name || ''}
        description={`${t('profile.landing.ssn')} ${user?.party?.person?.ssn}`}
      >
        <Flex className={styles.contactInfoFlex}>
          <Typography className={styles.contactInfo}>
            <h6>{t('profile.landing.email')}</h6>
            <p>{user?.email || ' - '}</p>
          </Typography>
          <Typography className={styles.contactInfo}>
            <h6>{t('profile.landing.address')}</h6>
          </Typography>
          <Typography className={styles.contactInfo}>
            <h6>{t('profile.landing.phone')}</h6>
            <p>{user?.party?.person?.mobileNumber || '-'}</p>
          </Typography>
        </Flex>
        <Flex justify="start" spacing={2}>
          <Button variant="outline" size="sm" onClick={() => {}}>
            {t('profile.landing.change.email.phone')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => {}}>
            {t('profile.landing.change.address')}
          </Button>
        </Flex>
      </DashboardHeader>
    </PageBase>
  );
};
