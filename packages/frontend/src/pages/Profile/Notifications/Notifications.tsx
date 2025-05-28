import {
  Divider,
  Heading,
  List,
  PageBase,
  PageNav,
  Section,
  Settings,
  SettingsItem,
  type SettingsItemProps,
  Switch,
} from '@altinn/altinn-components';
import { BellDotIcon, BellIcon, MobileIcon, PaperplaneIcon } from '@navikt/aksel-icons';
import { t } from 'i18next';
import { Fragment, useState } from 'react';
import { PageRoutes } from '../../routes';
// import { useProfile } from '../../../profile/useProfile';

const dummy = [
  {
    id: 'party:mathias',
    title: 'Kristian Haugen',
    description: 'Eier av Altinn',
    label: 'Eier',
    icon: {
      type: 'person',
      title: 'Kristian Haugen',
    },
  },
  {
    id: 'party:bergerbar',
    title: 'Lillehammer Bakeri',
    description: 'Bakeri i Lillehammer',
    icon: {
      type: 'company',
      title: 'Lillehammer Bakeri',
    },
  },
  {
    id: 'party:brann',
    title: 'Oslo Bryggeri',
    description: 'Bryggeri i Oslo',
    icon: {
      type: 'company',
      title: 'Oslo Bryggeri',
    },
  },
  {
    id: 'party:daily-pot',
    title: 'Norsk Naturmat',
    description: 'Naturlig mat fra Norge',
    icon: {
      type: 'company',
      title: 'Norsk Naturmat',
    },
  },
  {
    id: 'customGroup',
    title: 'Anna og venner',
    description: 'En gruppe med venner og familie',
    icon: {
      type: 'person',
      title: 'Anna og venner',
    },
  },
  {
    id: 'allAccounts',
    title: 'Alle bedrifter',
    description: 'Alle bedrifter du har tilgang til',
    label: 'Alle',
    icon: {
      type: 'company',
      title: 'Alle bedrifter',
    },
  },
  {
    id: 'party:keeperhansker',
    title: 'Trondheim Teknikk',
    description: 'Teknisk utstyr og tjenester i Trondheim',
    label: 'Teknikk',
    icon: {
      type: 'company',
      title: 'Trondheim Teknikk',
    },
  },
  {
    id: 'party:stadiondrift',
    title: 'Fjordkraft AS',
    description: 'Strømleverandør i Norge',
    icon: {
      type: 'company',
      title: 'Fjordkraft AS',
    },
  },
  {
    id: 'party:landslaget',
    title: 'Viking Invest',
    description: 'Investeringer i Norge og utlandet',
    icon: {
      type: 'company',
      title: 'Viking Invest',
    },
  },
];

export const Notifications = () => {
  const [settings, setSettings] = useState(true);
  // const { favoriteActors = dummy, profile, user, toggleFavoriteActor } = useProfile();

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
            label: t('sidebar.profile.notifications'),
            href: PageRoutes.notifications,
          },
        ]}
      />
      <Heading size="xl">Varslingsinnstillinger</Heading>

      <Section spacing={6}>
        <Settings>
          <List>
            <SettingsItem
              icon={settings ? BellDotIcon : BellIcon}
              title={settings ? 'Varslinger er på' : 'Ingen varslinger'}
              controls={
                <Switch
                  name="alerts"
                  onChange={() => setSettings(!settings)}
                  checked={!!settings}
                  reverse
                  size="sm"
                  label={<span data-size="xs">{settings ? 'Skru av ' : 'Skru på '}</span>}
                />
              }
            />
            {settings && (
              <>
                <Divider as="li" />
                <SettingsItem
                  icon={{ svgElement: PaperplaneIcon, theme: 'default' }}
                  title="Varslingsadresse for e-post"
                  value="mathias.dyngeland@gmail.com"
                  badge={<span data-size="xs">Endre epost</span>}
                  linkIcon
                />
                <Divider as="li" />
                <SettingsItem
                  icon={{ svgElement: MobileIcon, theme: 'default' }}
                  title="SMS-varslinger"
                  value="99009900"
                  badge={<span data-size="xs">Endre mobilnummer</span>}
                  linkIcon
                />
              </>
            )}
          </List>
        </Settings>
        {settings && <Heading size="lg">Varslinger per aktør</Heading>}
        <AccountSettings actors={dummy as Array<SettingsItemProps>} />
      </Section>
    </PageBase>
  );
};

export const AccountSettings = ({ actors }: { actors: Array<SettingsItemProps> }) => {
  const [expanded, setExpanded] = useState<string | undefined>(undefined);

  return (
    <Settings>
      <List>
        {actors.map((item, index) => {
          return (
            <Fragment key={item.id}>
              {index > 0 && <Divider />}
              <SettingsItem
                icon={item.icon}
                title={item.title}
                description={item.description}
                badge={item.label && { label: String(item.label) }}
                collapsible
                onClick={() => setExpanded(expanded === item.id ? undefined : item.id)}
                expanded={expanded === item.id}
              >
                <h1>settings</h1>
              </SettingsItem>
            </Fragment>
          );
        })}
      </List>
    </Settings>
  );
};
