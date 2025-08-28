import {
  Divider,
  Heading,
  List,
  PageBase,
  PageNav,
  Section,
  SettingsItem,
  SettingsList,
  SettingsSection,
} from '@altinn/altinn-components';
import { MobileIcon, PaperplaneIcon } from '@navikt/aksel-icons';

import type { NotificationSettingsResponse, PartyFieldsFragment } from 'bff-types-generated';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParties } from '../../../api/hooks/useParties';
import { getNotificationsettingsByUuid } from '../../../api/queries';
import { AccountModal, AccountNotificationSettings } from '../PartiesOverviewPage/NotificationSettings';
import { getBreadcrumbs } from '../PartiesOverviewPage/partyFieldToAccountList';
import {
  flattenParties,
  partyFieldFragmentToNotificationsListItem,
} from '../PartiesOverviewPage/partyFieldToNotificationsList';
import { useProfile } from '../useProfile';

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const { user } = useProfile();
  const userHasNotificationsActivated =
    (!!user?.email?.length && user?.email?.length > 0) ||
    (!!user?.phoneNumber?.length && user?.phoneNumber?.length > 0);

  return (
    <PageBase>
      <PageNav breadcrumbs={getBreadcrumbs(user?.party?.name || '')} />
      <Heading size="xl">{t('profile.notifications.heading')}</Heading>

      <Section spacing={6}>
        <SettingsSection>
          <List>
            {userHasNotificationsActivated && (
              <>
                <SettingsItem
                  icon={{ svgElement: MobileIcon, theme: 'default' }}
                  title={t('profile.settings.sms_notifications')}
                  value={user?.phoneNumber || 'Ingen telefonnummer registrert'}
                  badge={<span data-size="xs">{t('profile.notifications.change_phone')}</span>}
                  linkIcon
                />
                <Divider as="li" />
                <SettingsItem
                  icon={{ svgElement: PaperplaneIcon, theme: 'default' }}
                  title={t('profile.notifications.email_for_alerts')}
                  value={user?.email || ''}
                  badge={<span data-size="xs">{t('profile.notifications.change_email')}</span>}
                  linkIcon
                />
              </>
            )}
          </List>
        </SettingsSection>
        {userHasNotificationsActivated && <Heading size="lg">{t('profile.notifications.heading_per_actor')}</Heading>}
        <AccountSettings />
      </Section>
    </PageBase>
  );
};

export interface NotificationAccountsType extends PartyFieldsFragment {
  notificationSettings?: NotificationSettingsResponse;
  parentId?: string;
}

export const AccountSettings = () => {
  const [showModalForAccount, setShowModalForAccount] = useState<NotificationAccountsType | null>(null);

  const { parties, isLoading: isLoadingParties } = useParties();
  const [partiesToShow, setPartiesToShow] = useState<NotificationAccountsType[]>([]);

  const onSave = (updatedParty: NotificationAccountsType | undefined) => {
    if (!updatedParty) {
      return;
    }
    const updatedParties = partiesToShow.map((party) =>
      party.partyUuid === updatedParty.partyUuid ? updatedParty : party,
    );
    setPartiesToShow(updatedParties);
    setShowModalForAccount(null);
  };

  // Below code fetches notification settings for all parties and merges them into partiesToShow state array
  useEffect(() => {
    if (parties?.length > 0 && !isLoadingParties) {
      const fetchPartiesWithNotifications = async () => {
        const temp = await Promise.all(
          flattenParties(parties)
            .filter((party) => !party.isCurrentEndUser)
            .filter((party) => party.partyType === 'Organization')
            .map(async (party) => {
              const data = await getNotificationsettingsByUuid(party.partyUuid);
              const notificationSettings = (data?.notificationsettingsByUuid as NotificationSettingsResponse) || null;
              return { ...party, notificationSettings, key: party.partyUuid };
            }),
        );
        setPartiesToShow(temp);
      };
      fetchPartiesWithNotifications();
    }
  }, [parties, isLoadingParties]);

  if (isLoadingParties) {
    return <div>Loading...</div>;
  }

  const groups = partiesToShow.reduce<Record<string, { title: string }>>((acc, item) => {
    if (!acc[item.partyUuid]) {
      acc[item.partyUuid] = { title: item.name };
    }
    return acc;
  }, {});

  return (
    <SettingsSection spacing={6}>
      <SettingsList
        groups={groups}
        items={partyFieldFragmentToNotificationsListItem({
          flattenedParties: partiesToShow,
          setShowModalForAccount,
        })}
      />
      {!!showModalForAccount && (
        <AccountModal
          title={'Varslingsinnstillinger'}
          open={!!showModalForAccount}
          onClose={() => setShowModalForAccount(null)}
        >
          <AccountNotificationSettings
            party={showModalForAccount}
            onClose={() => setShowModalForAccount(null)}
            onSave={(updatedParty?: NotificationAccountsType) => onSave(updatedParty)}
          />
        </AccountModal>
      )}
    </SettingsSection>
  );
};
