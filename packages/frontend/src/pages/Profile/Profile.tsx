import {
  Button,
  DashboardCard,
  DashboardHeader,
  Flex,
  Grid,
  PageBase,
  PageNav,
  Typography,
} from '@altinn/altinn-components';
import { BellIcon, CogIcon, HeartIcon } from '@navikt/aksel-icons';
import type { Person } from 'bff-types-generated';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { useProfile } from '../../profile';
import { formatNorwegianSSN } from '../../profile/formatSSN';
import { PageRoutes } from '../routes';
import styles from './profile.module.css';

const buildAddressString = (person: Person | undefined | null) => {
  if (!person) {
    return '';
  }
  const street = person.addressStreetName || '';
  const houseNumber = person.addressHouseNumber || '';
  const houseLetter = person.addressHouseLetter || '';
  const municipalNumber = person.addressMunicipalNumber || '';
  const municipalName = person.addressMunicipalName || '';

  return `${street} ${houseNumber}${houseLetter}, ${municipalNumber} ${municipalName}`;
};

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
        description={`${t('profile.landing.ssn')} ${formatNorwegianSSN(user?.party?.person?.ssn)}`}
      >
        <Flex className={styles.contactInfoFlex}>
          <Typography className={styles.contactInfo}>
            <h6>{t('profile.landing.email')}</h6>
            <p>{user?.email || ' - '}</p>
          </Typography>
          <Typography className={styles.contactInfo}>
            <h6>{t('profile.landing.address')}</h6>
            <p>{buildAddressString(user?.party?.person)}</p>
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

      <Grid spacing={2} cols={3}>
        <Link to={PageRoutes.bin}>
          <DashboardCard
            icon={{ svgElement: HeartIcon }}
            title={t('profile.landing.card.title.favourites')}
            color="person"
          >
            {t('profile.landing.card.favourites')}
          </DashboardCard>
        </Link>

        <DashboardCard icon={{ svgElement: BellIcon }} title={t('profile.landing.card.title.settings')} color="person">
          {t('profile.landing.card.settings')}
        </DashboardCard>
        <DashboardCard icon={{ svgElement: CogIcon }} title={t('profile.landing.card.title.language')} color="person">
          {t('profile.landing.card.language')}
        </DashboardCard>
      </Grid>
    </PageBase>
  );
};
