import {
  type AvatarProps,
  formatDisplayName,
  Heading,
  List,
  PageBase,
  PageNav,
  Section,
  SettingsItem,
  type SettingsItemProps,
  SettingsList,
  SettingsSection,
  Toolbar,
} from '@altinn/altinn-components';
import { MobileIcon, PaperplaneIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NotificationSettingsResponse, PartyFieldsFragment } from 'bff-types-generated';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import { usePageTitle } from '../../../hooks/usePageTitle';
import {
  type NotificationType,
  UserNotificationSettingsModal,
} from '../PartiesOverviewPage/UserNotificationSettingsModal';
import { partyFieldFragmentToNotificationsListItem } from '../PartiesOverviewPage/partyFieldToNotificationsList';
import { usePartiesWithNotificationSettings } from '../usePartiesWithNotificationSettings';
import { useProfile } from '../useProfile';
import { CompanyNotificationSettingsModal } from './CompanyNotificationSettingsModal';
import { PageRoutes } from '../../routes';

export interface NotificationAccountsType extends PartyFieldsFragment {
  notificationSettings?: NotificationSettingsResponse;
  parentId?: string;
}

export const NotificationsPage = () => {
  const [showNotificationModal, setShowNotificationModal] = useState<NotificationType>('none');
  const [searchValue, setSearchValue] = useState('');
  const { t } = useTranslation();
  usePageTitle({ baseTitle: t('component.notifications') });
  const { user } = useProfile();
  const [notificationParty, setNotificationParty] = useState<NotificationAccountsType | null>(null);
  const { partiesWithNotificationSettings, isLoading: isLoadingPartiesWithNotificationSettings } =
    usePartiesWithNotificationSettings();
  const queryClient = useQueryClient();

  const onSave = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE_PARTIES_WITH_NOTIFICATION_SETTINGS] });
  };

  const groups = partiesWithNotificationSettings.reduce<Record<string, { title: string }>>((acc, item) => {
    if (!acc[item.partyUuid]) {
      acc[item.partyUuid] = { title: '' };
    }
    return acc;
  }, {});

  if (partiesWithNotificationSettings.length === 0) {
    return null;
  }

  const filteredParties = partiesWithNotificationSettings.filter((party) => {
    if (
      party.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      party.notificationSettings?.emailAddress?.toLowerCase().includes(searchValue.toLowerCase()) ||
      party.notificationSettings?.phoneNumber?.toLowerCase().includes(searchValue.toLowerCase())
    ) {
      return true;
    }
    return false;
  });

  const getBreadcrumbs = (person?: AvatarProps, reverseNameOrder?: boolean) => {
    if (!person) return [];
    return [
      {
        label: t('word.frontpage'),
        href: PageRoutes.inbox,
      },
      {
        label: formatDisplayName({
          fullName: person.name,
          type: person.type as 'person' | 'company',
          reverseNameOrder,
        }),
        href: PageRoutes.profile,
      },
      {
        label: t('sidebar.profile.notifications'),
        href: PageRoutes.partiesOverview,
      },
    ];
  };

  const personalNotificationSettings: SettingsItemProps[] = [
    {
      icon: { svgElement: MobileIcon, theme: 'default' },
      title: t('profile.settings.sms_notifications'),
      value: user?.phoneNumber || 'Ingen telefonnummer registrert',
      badge: <span data-size="xs">{t('profile.notifications.change_phone')}</span>,
      onClick: () => setShowNotificationModal('phoneNumber'),
      linkIcon: true,
      as: 'button',
    },
    {
      icon: { svgElement: PaperplaneIcon, theme: 'default' },
      title: t('profile.notifications.email_for_alerts'),
      value: user?.email || '',
      badge: <span data-size="xs">{t('profile.notifications.change_email')}</span>,
      onClick: () => setShowNotificationModal('email'),
      linkIcon: true,
      as: 'button',
    },
  ];

  const personalNotificationSettingsFiltered = personalNotificationSettings.filter((setting) => {
    if (
      String(setting.value || '')
        .toLowerCase()
        .includes(searchValue.toLowerCase())
    ) {
      return true;
    }
    return false;
  });

  return (
    <PageBase>
      <PageNav
        breadcrumbs={getBreadcrumbs(
          {
            name: user?.party?.name ?? '',
            type: 'person',
          },
          true,
        )}
      />
      <Heading size="xl">{t('sidebar.profile.notifications')}</Heading>

      <Section spacing={6}>
        <Toolbar
          search={{
            name: 'party-search',
            placeholder: t('parties.search.placeholder'),
            value: searchValue,
            onChange: (e) => setSearchValue((e.target as HTMLInputElement).value),
            onClear: () => setSearchValue(''),
          }}
        />
        <Heading size="md">{t('profile.notifications.heading')}</Heading>
        {personalNotificationSettingsFiltered.length > 0 ? (
          <>
            <SettingsSection>
              <List>
                {personalNotificationSettingsFiltered.map((setting, index) => (
                  <SettingsItem key={index} {...setting} />
                ))}
              </List>
            </SettingsSection>
          </>
        ) : (
          <span>{t('emptyState.noHits.title')}</span>
        )}

        <Heading size="lg">{t('profile.notifications.heading_per_actor')}</Heading>
        {filteredParties.length > 0 ? (
          <SettingsList
            groups={groups}
            items={partyFieldFragmentToNotificationsListItem({
              flattenedParties: filteredParties,
              setNotificationParty,
            })}
          />
        ) : (
          <span>{t('emptyState.noHits.title')}</span>
        )}
        {isLoadingPartiesWithNotificationSettings ? (
          <div>Loading...</div>
        ) : (
          <CompanyNotificationSettingsModal
            notificationParty={notificationParty}
            setNotificationParty={setNotificationParty}
            onSave={onSave}
          />
        )}
      </Section>
      <UserNotificationSettingsModal notificationType={showNotificationModal} setShowModal={setShowNotificationModal} />
    </PageBase>
  );
};
