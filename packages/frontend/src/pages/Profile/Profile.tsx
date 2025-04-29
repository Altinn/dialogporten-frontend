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
import { t } from 'i18next';
import { PageRoutes } from '../routes';
// import { useProfile } from '../../profile';
import styles from './profile.module.css';

export const Profile = () => {
  // const { profile } = useProfile();

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

      <DashboardHeader name="Ronald McDonald" description="Fødselsnummer: 26.06.1966 XX.XX.XX">
        <Flex className={styles.contactInfoFlex}>
          <Typography className={styles.contactInfo}>
            <h6>E-post</h6>
            <p>mathias.dyngeland@brann.no</p>
          </Typography>
          <Typography className={styles.contactInfo}>
            <h6>Adresse</h6>
            <p>Idrettsveien 1, 5020 Bergen</p>
          </Typography>
          <Typography className={styles.contactInfo}>
            <h6>Telefon</h6>
            <p>55 00 00 00</p>
          </Typography>
        </Flex>
        <Flex justify="start" spacing={2}>
          <Button variant="outline" size="sm" onClick={() => {}}>
            Endre telefon/e-post
          </Button>
          <Button variant="outline" size="sm" onClick={() => {}}>
            Endre adresse
          </Button>
        </Flex>
      </DashboardHeader>

      <Grid spacing={2} cols={3}>
        <DashboardCard icon={{ svgElement: HeartIcon }} title="Mine aktører" color="person">
          Sett opp favoritter og grupper for aktørene dine.
        </DashboardCard>
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
