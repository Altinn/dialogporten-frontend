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
        description={`Fødselsnummer: ${formatNorwegianSSN(user?.party?.person?.ssn)}`}
      >
        <Flex className={styles.contactInfoFlex}>
          <Typography className={styles.contactInfo}>
            <h6>E-post</h6>
            <p>{user?.email || ' - '}</p>
          </Typography>
          <Typography className={styles.contactInfo}>
            <h6>Adresse</h6>
            <p>{buildAddressString(user?.party?.person)}</p>
          </Typography>
          <Typography className={styles.contactInfo}>
            <h6>Telefon</h6>
            <p>{user?.party?.person?.mobileNumber || '-'}</p>
          </Typography>
        </Flex>
        <Flex justify="start" spacing={2}>
          <Button variant="outline" size="sm" onClick={() => {}}>
            Endre e-post/telefon
          </Button>
          <Button variant="outline" size="sm" onClick={() => {}}>
            Endre adresse
          </Button>
        </Flex>
      </DashboardHeader>

      <Grid spacing={2} cols={3}>
        <Link to={PageRoutes.bin}>
          <DashboardCard icon={{ svgElement: HeartIcon }} title="Mine aktører" color="person">
            Sett opp favoritter og grupper for aktørene dine.
          </DashboardCard>
        </Link>

        <DashboardCard icon={{ svgElement: BellIcon }} title="Mine varslinger" color="person">
          Endre innstilinger for varslinger.
        </DashboardCard>
        <DashboardCard icon={{ svgElement: CogIcon }} title="Flere innstillinger" color="person">
          Språk og andre preferanser.
        </DashboardCard>
      </Grid>
    </PageBase>
  );
};
