import {
  Divider,
  Fieldset,
  Heading,
  List,
  PageBase,
  PageNav,
  Section,
  Settings,
  SettingsItem,
  type SettingsItemProps,
  Switch,
  TextField,
} from '@altinn/altinn-components';
import { BellDotIcon, BellIcon, MobileIcon, PaperplaneIcon } from '@navikt/aksel-icons';

import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageRoutes } from '../../routes';

const dummy = [
  {
    id: 'party:mathias',
    title: 'Kristian Haugen',
    description: 'Eier av Altinn',
    label: 'Eier',
    icon: {
      type: 'person',
      name: 'Kristian Haugen',
    },
  },
  {
    id: 'party:bergerbar',
    title: 'Lillehammer Bakeri',
    description: 'Bakeri i Lillehammer',
    icon: {
      type: 'company',
      name: 'Lillehammer Bakeri',
    },
  },
  {
    id: 'party:brann',
    title: 'Oslo Bryggeri',
    description: 'Bryggeri i Oslo',
    icon: {
      type: 'company',
      name: 'Oslo Bryggeri',
    },
  },
  {
    id: 'party:daily-pot',
    title: 'Norsk Naturmat',
    description: 'Naturlig mat fra Norge',
    icon: {
      type: 'company',
      name: 'Norsk Naturmat',
    },
  },
  {
    id: 'customGroup',
    title: 'Anna og venner',
    description: 'En gruppe med venner og familie',
    icon: {
      type: 'person',
      name: 'Anna og venner',
    },
  },
  {
    id: 'allAccounts',
    title: 'Alle bedrifter',
    description: 'Alle bedrifter du har tilgang til',
    label: 'Alle',
    icon: {
      type: 'company',
      name: 'Alle bedrifter',
    },
  },
  {
    id: 'party:keeperhansker',
    title: 'Trondheim Teknikk',
    description: 'Teknisk utstyr og tjenester i Trondheim',
    label: 'Teknikk',
    icon: {
      type: 'company',
      name: 'Trondheim Teknikk',
    },
  },
  {
    id: 'party:stadiondrift',
    title: 'Fjordkraft AS',
    description: 'Strømleverandør i Norge',
    icon: {
      type: 'company',
      name: 'Fjordkraft AS',
    },
  },
  {
    id: 'party:landslaget',
    title: 'Viking Invest',
    description: 'Investeringer i Norge og utlandet',
    icon: {
      type: 'company',
      name: 'Viking Invest',
    },
  },
];

export const Notifications = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(true);
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
      <Heading size="xl">{t('profile.notifications.heading')}</Heading>

      <Section spacing={6}>
        <Settings>
          <List>
            <SettingsItem
              icon={settings ? BellDotIcon : BellIcon}
              title={settings ? t('profile.notifications.are_on') : t('profile.notifications.no_notifications')}
              controls={
                <Switch
                  name="alerts"
                  onChange={() => setSettings(!settings)}
                  checked={!!settings}
                  reverse
                  size="sm"
                  label={
                    <span data-size="xs">
                      {settings ? t('profile.notifications.turn_off') : t('profile.notifications.turn_on')}
                    </span>
                  }
                />
              }
            />
            {settings && (
              <>
                <Divider as="li" />
                <SettingsItem
                  icon={{ svgElement: PaperplaneIcon, theme: 'default' }}
                  title={t('profile.notifications.email_for_alerts')}
                  value="mathias.dyngeland@gmail.com"
                  badge={<span data-size="xs">{t('profile.notifications.change_email')}</span>}
                  linkIcon
                />
                <Divider as="li" />
                <SettingsItem
                  icon={{ svgElement: MobileIcon, theme: 'default' }}
                  title={t('profile.settings.sms_notifications')}
                  value="99009900"
                  badge={<span data-size="xs">{t('profile.notifications.change_phone')}</span>}
                  linkIcon
                />
              </>
            )}
          </List>
        </Settings>
        {settings && <Heading size="lg">{t('profile.notifications.heading_per_actor')}</Heading>}
        <AccountSettings actors={dummy as Array<SettingsItemProps>} />
      </Section>
    </PageBase>
  );
};

type AlertSettings = {
  [id: string]: {
    smsAlerts: boolean;
    emailAlerts: boolean;
  };
};

export const AccountSettings = ({ actors }: { actors: Array<SettingsItemProps> }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | undefined>(undefined);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({});

  const handleAlertChange = (id: string, alerts: { smsAlerts: boolean; emailAlerts: boolean }) => {
    setAlertSettings((prev) => ({
      ...prev,
      [id]: alerts,
    }));
  };

  return (
    <Settings>
      <List>
        {actors.map((item, index) => {
          const alerts = alertSettings[item.id!] || { smsAlerts: false, emailAlerts: false };
          let badgeLabel: string | undefined;
          if (alerts.smsAlerts && alerts.emailAlerts) {
            badgeLabel = `SMS ${t('word.and')} ${t('profile.landing.email')}`;
          } else if (alerts.smsAlerts) {
            badgeLabel = 'SMS';
          } else if (alerts.emailAlerts) {
            badgeLabel = t('profile.landing.email');
          } else {
            badgeLabel = undefined;
          }

          return (
            <Fragment key={item.id}>
              {index > 0 && <Divider />}
              <SettingsItem
                icon={item.icon}
                as="button"
                title={item.title}
                description={item.description}
                badge={badgeLabel && { label: badgeLabel }}
                collapsible
                onClick={() => setExpanded(expanded === item.id ? undefined : item.id)}
                expanded={expanded === item.id}
              >
                <AccountDetails
                  id={item.id!}
                  onAlertChange={handleAlertChange}
                  initialSmsAlerts={alerts.smsAlerts}
                  initialEmailAlerts={alerts.emailAlerts}
                />
              </SettingsItem>
            </Fragment>
          );
        })}
      </List>
    </Settings>
  );
};

type AccountDetailsProps = {
  id: string;
  onAlertChange: (id: string, alerts: { smsAlerts: boolean; emailAlerts: boolean }) => void;
  initialSmsAlerts: boolean;
  initialEmailAlerts: boolean;
};

const AccountDetails = ({ id, onAlertChange, initialSmsAlerts, initialEmailAlerts }: AccountDetailsProps) => {
  const [smsAlerts, setSmsAlerts] = useState(initialSmsAlerts);
  const [emailAlerts, setEmailAlerts] = useState(initialEmailAlerts);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSmsChange = (checked: boolean) => {
    setSmsAlerts(checked);
    onAlertChange(id, { smsAlerts: checked, emailAlerts });
  };

  const handleEmailChange = (checked: boolean) => {
    setEmailAlerts(checked);
    onAlertChange(id, { smsAlerts, emailAlerts: checked });
  };

  return (
    <Section padding={6} spacing={6}>
      <Fieldset>
        <Switch
          label="Varsle på SMS"
          name="smsAlerts"
          value="SMS"
          checked={smsAlerts}
          onChange={(e) => handleSmsChange(e.target.checked)}
        />
        {smsAlerts && (
          <TextField
            name="phone"
            placeholder="Mobiltelefon"
            type="number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}
      </Fieldset>
      <Fieldset>
        <Switch
          label="Varsle på e-post"
          name="emailAlerts"
          value="E-post"
          checked={emailAlerts}
          onChange={(e) => handleEmailChange(e.target.checked)}
        />
        {emailAlerts && (
          <TextField
            name="email"
            placeholder="E-postadresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Fieldset>
    </Section>
  );
};
