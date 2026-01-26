import {
  AccountList,
  AccountListItemDetails,
  type AccountListItemProps,
  type AccountOrganizationItemProps,
  type AvatarType,
  type AvatarVariant,
  Badge,
  Heading,
  Icon,
  PageBase,
  PageNav,
  Section,
  type SettingsItemProps,
  Switch,
  Toolbar,
} from '@altinn/altinn-components';
import type { AccountListItemType } from '@altinn/altinn-components/dist/types/lib/components/Account/AccountListItem';
import { BellIcon, HashtagIcon, HouseHeartFillIcon, HouseHeartIcon, InboxIcon } from '@navikt/aksel-icons';
import { type ElementType, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation } from 'react-router-dom';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import {
  type PartyItemProp,
  formatNorwegianId,
  useAccounts,
} from '../../../components/PageLayout/Accounts/useAccounts';
import { useFeatureFlag } from '../../../featureFlags/useFeatureFlag';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { useProfileOnboarding } from '../../../onboardingTour/useProfileOnboarding';
import { PageRoutes } from '../../routes.ts';
import { getBreadcrumbs } from '../Settings/Settings.tsx';
import { SettingsType, useSettings } from '../Settings/useSettings.tsx';
import { useAccountFilters } from '../useAccountFilters.tsx';
import { ConfirmSetPreselectedActorModal } from './ConfirmSetPreselectedActorModal.tsx';
import styles from './partiesOverviewPage.module.css';

export const PartiesOverviewPage = () => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const { getAccountAlertSettings, settings } = useSettings();
  const isDeletedUnitsFilterEnabled = useFeatureFlag<boolean>('inbox.enableDeletedUnitsFilter');
  const {
    addFavoriteParty,
    deleteFavoriteParty,
    setPreSelectedParty,
    user,
    shouldShowDeletedEntities,
    updateShowDeletedEntities,
  } = useProfile();
  const [openConfirmSetPreselectedActorModal, setOpenConfirmSetPreselectedActorModal] = useState<PartyItemProp | null>(
    null,
  );
  const { parties, selectedParties, allOrganizationsSelected, isLoading, flattenedParties } = useParties();
  const [searchValue, setSearchValue] = useState<string>('');
  const [expandedItem, setExpandedItem] = useState<string>('');

  const includeDeletedParties = isDeletedUnitsFilterEnabled ? (shouldShowDeletedEntities ?? false) : true;

  const { filters, getFilterLabel, filterState, setFilterState, filteredParties, isSearching } = useAccountFilters({
    searchValue,
    parties,
    includeDeletedParties: true,
  });

  const { accounts, accountGroups } = useAccounts({
    parties: filteredParties,
    availableParties: parties,
    selectedParties,
    allOrganizationsSelected,
    isLoading,
    options: {
      showFavorites: !isSearching,
    },
  });

  usePageTitle({ baseTitle: t('component.parties_settings') });
  useProfileOnboarding({ isLoading, pageType: 'parties' });

  const toggleExpanded = (id: string) => setExpandedItem((currentId) => (currentId === id ? '' : id));

  const onToggleFavourite = async (partyUuid: string, isFavorite?: boolean) => {
    if (isFavorite) {
      await deleteFavoriteParty(partyUuid);
    } else {
      await addFavoriteParty(partyUuid);
    }
  };

  const getPartyButtons = (isCurrentEndUser: boolean, partyId: string) => {
    const inboxLink = PageRoutes.inbox + (isCurrentEndUser ? '' : `?party=${partyId}`);
    return [{ label: t('parties.go_to_inbox'), as: (props: LinkProps) => <Link {...props} to={inboxLink} /> }];
  };

  const getPartyNotificationsSettings = (id: string): SettingsItemProps[] => {
    if (id && typeof getAccountAlertSettings === 'function') {
      const settings = getAccountAlertSettings(id);
      return [
        {
          ...settings,
          id: 'mobile',
          icon: BellIcon,
          title: settings.value
            ? t('profile.notifications.my_notifications')
            : t('profile.notifications.no_notifications'),
        },
      ];
    }
    return [];
  };

  const getCompanySettings = (id: string): SettingsItemProps[] => {
    return [
      ...getPartyNotificationsSettings(id),
      {
        id: 'orgNr',
        icon: HashtagIcon,
        title: t('profile.organization_number'),
        value: formatNorwegianId(id, false),
      },
    ];
  };

  const getPersonSettings = (id: string, isCurrentEndUser: boolean): SettingsItemProps[] => {
    return [
      ...getPartyNotificationsSettings(id),
      {
        id: 'snr',
        icon: HashtagIcon,
        title: t('profile.birth_number'),
        value: formatNorwegianId(id, isCurrentEndUser),
      },
    ];
  };

  const createSubPartyItem = (
    subParty: { party: string; name: string; isDeleted: boolean },
    currentParty: { party: string } | undefined,
  ): AccountOrganizationItemProps => ({
    avatar: {
      type: 'company' as AvatarType,
      name: subParty.name,
      variant: 'outline' as AvatarVariant,
      isDeleted: subParty.isDeleted,
    },
    title: subParty.name,
    description: `${formatNorwegianId(subParty.party, false)} `,
    selected: subParty.party === currentParty?.party,
    as: 'span' as ElementType,
  });

  const createOrganizationItem = (
    item: {
      party: string;
      name: string;
      isDeleted: boolean;
      parentId?: string;
      subParties?: Array<{ party: string; name: string; isDeleted: boolean }>;
    },
    currentParty: { party: string } | undefined,
  ): AccountOrganizationItemProps => ({
    avatar: {
      type: 'company' as AvatarType,
      name: item.name,
      variant: item.parentId ? ('outline' as AvatarVariant) : undefined,
      isDeleted: item.isDeleted,
    },
    items: item.subParties?.map((subParty) => createSubPartyItem(subParty, item)),
    title: item.name,
    description: formatNorwegianId(item.party, false),
    selected: item.party === currentParty?.party,
    as: 'span' as ElementType,
  });

  const getOrganizationAccounts = (
    currentParty: { party: string } | undefined,
    parentParty: { party: string } | undefined,
    flattenedParties: Array<{
      party: string;
      name: string;
      isDeleted: boolean;
      parentId?: string;
      subParties?: Array<{ party: string; name: string; isDeleted: boolean }>;
    }>,
  ) => {
    const organizationAccounts = parentParty
      ? flattenedParties?.filter((item) => item.party.includes(parentParty.party)) || []
      : flattenedParties?.filter((item) => item.party.includes(currentParty?.party ?? '')) || [];

    return organizationAccounts?.map((item) => createOrganizationItem(item, currentParty));
  };

  const PartyDetails = ({
    type,
    isCurrentEndUser,
    id,
  }: { type: AccountListItemType; isCurrentEndUser: boolean; id: string }) => {
    const currentParty = flattenedParties?.find((item) => item.party === id);
    const parentParty = flattenedParties?.find((item) => item.partyUuid === currentParty?.parentId);

    const organizationAccounts = useMemo(() => {
      if (type !== 'company') return undefined;
      return getOrganizationAccounts(
        currentParty,
        parentParty,
        flattenedParties as Array<{
          party: string;
          isDeleted: boolean;
          name: string;
          parentId?: string;
          subParties?: Array<{ party: string; name: string; isDeleted: boolean }>;
        }>,
      );
    }, [type, currentParty, parentParty]);

    if (isCurrentEndUser) {
      const contactSettings = settings.filter((s) => s.groupId === 'contact');
      return (
        <AccountListItemDetails
          color="person"
          buttons={getPartyButtons(isCurrentEndUser, id)}
          settings={contactSettings}
        />
      );
    }

    if (type === 'company') {
      const companySettings = getCompanySettings(id);
      return (
        <AccountListItemDetails
          color="company"
          settings={companySettings}
          buttons={getPartyButtons(isCurrentEndUser, id)}
          organization={organizationAccounts}
        />
      );
    }

    if (type === 'person') {
      return (
        <AccountListItemDetails
          color="person"
          settings={getPersonSettings(id, isCurrentEndUser)}
          buttons={getPartyButtons(isCurrentEndUser, id)}
        />
      );
    }

    return null;
  };

  const mapAccountToPartyListItem = (account: PartyItemProp): AccountListItemProps => {
    const { label: _, variant: __, ...party } = account;
    const itemId = account.id + account.groupId;
    const isPreSelectedParty = user?.profileSettingPreference?.preselectedPartyUuid === party.uuid;
    const accountType = party.type === 'subunit' ? 'company' : party.type;
    return {
      ...party,
      type: accountType as AccountListItemType,
      groupId: String(party.groupId),
      favourite: party.isFavorite,
      isCurrentEndUser: party.isCurrentEndUser,
      isDeleted: party.isDeleted,
      collapsible: true,
      expanded: expandedItem === itemId,
      onClick: () => toggleExpanded(itemId),
      highlightWords: (searchValue ?? '').split(' '),
      as: 'button',
      title: party.name,
      onToggleFavourite: () => onToggleFavourite(party.uuid, party.isFavorite),
      children: (
        <PartyDetails
          type={accountType as AccountListItemType}
          isCurrentEndUser={party.isCurrentEndUser ?? false}
          id={party.id}
        />
      ),
      badge: !party.isCurrentEndUser && (
        <>
          {party.isDeleted && <Badge color="danger" label={t('badge.deleted')} variant="base" />}
          <button
            type="button"
            aria-label="Set preferred party"
            className={styles.preSelectedBadgeButton}
            onClick={() => setOpenConfirmSetPreselectedActorModal(party)}
          >
            <Icon
              className={styles.preSelectedBadgeIcon}
              svgElement={isPreSelectedParty ? HouseHeartFillIcon : HouseHeartIcon}
            />
          </button>
        </>
      ),
      contextMenu: {
        id: party.groupId + party.id + '-menu',
        items: [
          {
            id: party.groupId + 'inbox',
            groupId: 'inbox',
            icon: InboxIcon,
            title: t('profile.go_to_inbox'),
            as: (props) => <Link to={'/?party=' + party.id} {...props} />,
          },
        ],
      },
    };
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const accountListItems = useMemo(() => accounts.map(mapAccountToPartyListItem), [accounts]);

  const displayAccountListItems = useMemo(() => {
    if (includeDeletedParties) {
      return accountListItems;
    }
    return accountListItems.filter((item) => {
      if (item.groupId === SettingsType.favorites || item.groupId === 'primary') {
        return true;
      }
      return !item.isDeleted;
    });
  }, [accountListItems, includeDeletedParties]);

  // Filter deleted from search results when switched off
  const displayHits = useMemo(() => {
    const baseHits = displayAccountListItems.map((a) => ({ ...a, groupId: 'search' }));
    if (includeDeletedParties) {
      return baseHits;
    }
    return baseHits.filter((item) => !item.isDeleted);
  }, [displayAccountListItems, includeDeletedParties]);

  const searchGroup = {
    search: { title: t('search.hits', { count: displayHits.length }) },
  };

  return (
    <PageBase color="person">
      <PageNav breadcrumbs={getBreadcrumbs(t('sidebar.profile'), t('sidebar.profile.parties'), search)} />
      <Section as="header" spacing={6}>
        <Heading size="xl">{t('component.parties_settings')}</Heading>
        <Toolbar
          search={{
            name: 'party-search',
            placeholder: t('parties.search'),
            value: searchValue,
            onChange: (e) => setSearchValue((e.target as HTMLInputElement).value),
            onClear: () => setSearchValue(''),
          }}
          getFilterLabel={getFilterLabel}
          filterState={filterState}
          onFilterStateChange={setFilterState}
          filters={filters}
        >
          {isDeletedUnitsFilterEnabled && filterState?.partyScope?.[0] !== 'PERSONS' && (
            <Switch
              size="xs"
              checked={includeDeletedParties}
              onChange={(e) => updateShowDeletedEntities(e.target.checked)}
              aria-checked={includeDeletedParties}
              label={t('parties.filter.show_deleted')}
              className={styles.deletedFilter}
            />
          )}
        </Toolbar>
        {isSearching && displayHits.length === 0 && <Heading size="lg">{t('profile.settings.no_results')}</Heading>}
        <AccountList
          isVirtualized
          groups={isSearching ? searchGroup : accountGroups}
          items={isSearching ? displayHits : displayAccountListItems}
        />
      </Section>
      <ConfirmSetPreselectedActorModal
        showActor={openConfirmSetPreselectedActorModal}
        onClose={() => setOpenConfirmSetPreselectedActorModal(null)}
        onConfirm={async (partyUuid) => {
          await setPreSelectedParty(partyUuid);
        }}
      />
    </PageBase>
  );
};
