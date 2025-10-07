import {
  type AvatarProps,
  type BreadcrumbsProps,
  Heading,
  PageBase,
  PageNav,
  Section,
  type SettingsItemProps,
  SettingsList,
  Toolbar,
  formatDisplayName,
} from '@altinn/altinn-components';
import { BellIcon, MobileIcon, PaperplaneIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NotificationSettingsResponse, PartyFieldsFragment } from 'bff-types-generated';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { pruneSearchQueryParams } from '../../Inbox/queryParams';
import { PageRoutes } from '../../routes';
import { AccountListSkeleton } from '../AccountListSkeleton';
import {
  type NotificationType,
  UserNotificationSettingsModal,
} from '../PartiesOverviewPage/UserNotificationSettingsModal';
import { partyFieldFragmentToNotificationsListItem } from '../PartiesOverviewPage/partyFieldToNotificationsList';
import { usePartiesWithNotificationSettings } from '../usePartiesWithNotificationSettings';
import { useProfile } from '../useProfile';
import { CompanyNotificationSettingsModal } from './CompanyNotificationSettingsModal';
import { useAccountFilters } from './useAccountFilters';

export interface NotificationAccountsType extends PartyFieldsFragment {
  notificationSettings?: NotificationSettingsResponse;
  parentId?: string;
}

export interface UserNotificationType {
  icon: AvatarProps;
  title: string;
  notificationType: NotificationType;
}

export const NotificationsPage = () => {
  const { t } = useTranslation();
  usePageTitle({ baseTitle: t('component.notifications') });
  const { search } = useLocation();
  const [showNotificationModal, setShowNotificationModal] = useState<UserNotificationType | undefined>();
  const [searchValue, setSearchValue] = useState('');
  const { user, isLoading: isLoadingUser } = useProfile();
  const [notificationParty, setNotificationParty] = useState<NotificationAccountsType | null>(null);
  const { partiesWithNotificationSettings, isLoading: isLoadingPartiesWithNotificationSettings } =
    usePartiesWithNotificationSettings();
  const queryClient = useQueryClient();
  const onSave = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_SETTINGS_FOR_CURRENT_USER] });
  };
  const { filters, getFilterLabel, filterState, setFilterState, filteredParties } = useAccountFilters({
    searchValue,
    partiesToFilter: partiesWithNotificationSettings,
  });
  const groups = {
    self: {
      title: t('profile.notifications.heading'),
    },
    persons: {
      title: t('parties.filter.persons'),
    },
    companies: {
      title: t('parties.filter.companies'),
    },
  };

  const getBreadcrumbs = (person?: AvatarProps, reverseNameOrder?: boolean) => {
    if (!person) return [];
    return [
      {
        label: t('word.frontpage'),
        as: (props) => <Link {...props} to={PageRoutes.inbox + pruneSearchQueryParams(search)} />,
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
    ] as BreadcrumbsProps['items'];
  };

  const personalNotificationSettings: SettingsItemProps[] = [
    {
      id: '1',
      icon: { svgElement: MobileIcon, theme: 'default' },
      title: t('profile.settings.sms_notifications'),
      value: user?.phoneNumber || 'Ingen telefonnummer registrert',
      groupId: 'self',
      badge: {
        color: 'company',
        label: t('profile.parties', {
          count: partiesWithNotificationSettings.filter(
            (party) =>
              party.notificationSettings?.phoneNumber?.length &&
              party.notificationSettings?.phoneNumber?.length > 3 &&
              user?.phoneNumber?.length &&
              user?.phoneNumber?.length > 3 &&
              party.notificationSettings?.phoneNumber?.includes(user?.phoneNumber || ''),
          ).length,
        }),
      },
      onClick: () => {
        setShowNotificationModal({
          icon: BellIcon,
          title: t('profile.settings.sms_notifications'),

          notificationType: 'phoneNumber' as const,
        });
      },
      interactive: true,
      linkIcon: true,
      as: 'button',
    },
    {
      id: '2',
      icon: { svgElement: PaperplaneIcon, theme: 'default' },
      title: t('profile.notifications.email_for_alerts'),
      value: user?.email || '',
      groupId: 'self',
      badge: {
        color: 'company',
        label: t('profile.parties', {
          count: partiesWithNotificationSettings.filter(
            (party) =>
              party.notificationSettings?.emailAddress?.length &&
              party.notificationSettings?.emailAddress?.length > 3 &&
              user?.email?.length &&
              user?.email?.length > 3 &&
              party.notificationSettings?.emailAddress?.includes(user?.email || ''),
          ).length,
        }),
      },
      onClick: () => {
        setShowNotificationModal({
          icon: BellIcon,
          title: t('profile.notifications.email_for_alerts'),
          notificationType: 'email',
        });
      },
      interactive: true,
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
          getFilterLabel={getFilterLabel}
          filterState={filterState}
          onFilterStateChange={setFilterState}
          filters={filters}
        />
        {isLoadingPartiesWithNotificationSettings || isLoadingUser ? (
          <AccountListSkeleton />
        ) : filteredParties.length > 0 ? (
          <SettingsList
            groups={groups}
            items={[
              ...personalNotificationSettingsFiltered,
              ...partyFieldFragmentToNotificationsListItem({
                flattenedParties: filteredParties,
                setNotificationParty,
              }),
            ]}
          />
        ) : (
          <span>{t('emptyState.noHits.title')}</span>
        )}
        <CompanyNotificationSettingsModal
          notificationParty={notificationParty}
          onClose={() => setNotificationParty(null)}
          onSave={onSave}
        />
      </Section>
      <UserNotificationSettingsModal
        userNotification={showNotificationModal}
        onClose={() => setShowNotificationModal(undefined)}
      />
    </PageBase>
  );
};
