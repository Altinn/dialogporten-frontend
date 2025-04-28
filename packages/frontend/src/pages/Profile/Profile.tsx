import { Button, DashboardCard, DashboardHeader, Flex, PageBase, PageNav, Typography } from '@altinn/altinn-components';
import { t } from 'i18next';
import { PageRoutes } from '../routes';
// import { useProfile } from '../../profile';

export const Profile = () => {
  // const { profile } = useProfile();

  // console.log('Profile', profile);
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
        <Typography>
          <h6>E-post</h6>
          <p>mathias.dyngeland@brann.no</p>
          <h6>Telefon</h6>
          <p>55 00 00 00</p>
          <h6>Adresse</h6>
          <p>Idrettsveien 1, 5020 Bergen</p>
        </Typography>
        <Flex justify="start" spacing={2}>
          <Button variant="outline" size="sm" onClick={() => {}}>
            Endre telefon/e-post
          </Button>
          <Button variant="outline" size="sm" onClick={() => {}}>
            Endre adresse
          </Button>
        </Flex>
      </DashboardHeader>
      <Flex spacing={4}>
        <DashboardCard color="person">
          <h1>heeeeelooo</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus, sit amet dictum leo
            consectetur in. Maecenas in libero euismod, facilisis ligula ut, efficitur nunc. Donec a diam lectus, sit
            amet dictum leo consectetur in. Maecenas in libero euismod,{' '}
          </p>
        </DashboardCard>
        <DashboardCard color="person">
          <h1>heeeeelooo</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus, sit amet dictum leo
            consectetur in. Maecenas in libero euismod, facilisis ligula ut, efficitur nunc. Donec a diam lectus, sit
            amet dictum leo consectetur in. Maecenas in libero euismod,{' '}
          </p>
        </DashboardCard>
        <DashboardCard color="person">
          <h1>heeeeelooo</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus, sit amet dictum leo
            consectetur in. Maecenas in libero euismod, facilisis ligula ut, efficitur nunc. Donec a diam lectus, sit
            amet dictum leo consectetur in. Maecenas in libero euismod,{' '}
          </p>
        </DashboardCard>
      </Flex>
    </PageBase>
  );
};
