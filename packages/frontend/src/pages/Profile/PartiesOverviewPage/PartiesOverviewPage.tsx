import {
  type AccountListItemType,
  type AccountOrganizationItemProps,
  type AvatarType,
  type AvatarVariant,
  Badge,
  Button,
  ContextMenu,
  type ContextMenuProps,
  DsPagination,
  Heading,
  PageBase,
  Section,
  type SettingsItemProps,
  SettingsList,
  type SettingsListProps,
  SnackbarDuration,
  Switch,
  Toolbar,
  ToolbarFilter,
  ToolbarSearch,
  useDsPagination,
  useSnackbar,
} from '@altinn/altinn-components';
import { formatDate } from '@altinn/altinn-components';
import {
  BellIcon,
  FilesIcon,
  HashtagIcon,
  HeartFillIcon,
  HeartIcon,
  HouseHeartFillIcon,
  HouseHeartIcon,
  InboxIcon,
  MobileIcon,
  PaperplaneIcon,
} from '@navikt/aksel-icons';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { type ElementType, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps } from 'react-router-dom';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import {
  type PartyItemProp,
  formatNorwegianId,
  useAccounts,
} from '../../../components/PageLayout/Accounts/useAccounts';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { PageRoutes } from '../../routes.ts';
import { useAccountFilters } from '../useAccountFilters.tsx';
import { SettingsType, useSettings } from '../useSettings.tsx';
import { ConfirmSetPreselectedActorModal } from './ConfirmSetPreselectedActorModal.tsx';
import { PartyDetails } from './PartyDetails.tsx';
import styles from './partiesOverviewPage.module.css';

export type PreselectedPartyOperationType = 'set' | 'unset';

export type PreselectedActorModalProps = {
  party?: PartyItemProp;
  operation: PreselectedPartyOperationType;
};

const PAGE_SIZE = 50;

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
  description: `${formatNorwegianId(subParty.party)} `,
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
  items: item.subParties?.map((subParty) => createSubPartyItem(subParty, currentParty)),
  title: item.name,
  description: formatNorwegianId(item.party),
  selected: item.party === currentParty?.party,
  as: 'span' as ElementType,
});

export const PartiesOverviewPage = () => {
  const { t } = useTranslation();
  const { parties, selectedParties, selectedGroup, isLoading, partyGraph, setSelectedPartyIds } = useParties();
  const { getAccountAlertSettings, settings } = useSettings({
    options: {
      includeGroups: [SettingsType.contact],
    },
  });
  const {
    addFavoriteParty,
    deleteFavoriteParty,
    setPreSelectedParty,
    shouldShowDeletedEntities,
    updateShowDeletedEntities,
  } = useProfile();
  const [openConfirmSetPreselectedActorModal, setOpenConfirmSetPreselectedActorModal] =
    useState<PreselectedActorModalProps | null>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const deferredSearchValue = useDeferredValue(searchValue);
  const [expandedItem, setExpandedItem] = useState<string>('');
  const { openSnackbar } = useSnackbar();

  const includeDeletedParties = shouldShowDeletedEntities ?? false;
  const { filters, getFilterLabel, filterState, setFilterState, filteredParties, isSearching } = useAccountFilters({
    searchValue: deferredSearchValue,
    parties,
  });

  const [currentPage, setCurrentPage] = useState<number>(1);

  const { accounts, accountGroups, accountsTotal } = useAccounts({
    parties: filteredParties,
    availableParties: parties,
    selectedParties,
    selectedGroup,
    isLoading,
    partyGraph,
    setSelectedPartyIds,
    options: {
      showFavorites: !isSearching,
      pagination: { offset: (currentPage - 1) * PAGE_SIZE, limit: PAGE_SIZE },
    },
  });

  usePageTitle({ baseTitle: t('sidebar.profile.parties') });

  const toggleExpanded = (id: string) => setExpandedItem((currentId) => (currentId === id ? '' : id));

  const onToggleFavourite = async (partyUuid: string, isFavorite?: boolean) => {
    if (isFavorite) {
      await deleteFavoriteParty(partyUuid);
    } else {
      await addFavoriteParty(partyUuid);
    }
  };

  const getGoToInboxButton = (party: { party: string; isCurrentEndUser: boolean }) => {
    const isOrg = !party.isCurrentEndUser && party.party.includes('urn:altinn:organization');
    const to = PageRoutes.inbox + (isOrg ? `?party=${party.party}` : '');
    return {
      label: t('parties.go_to_inbox'),
      as: (props: LinkProps) => (
        <Link
          {...props}
          onClick={() => {
            if (!isOrg) {
              setSelectedPartyIds([party.party], null);
            }
          }}
          to={to}
        />
      ),
    };
  };

  const getNotificationsSettings = (id: string): SettingsItemProps[] => {
    if (!id || typeof getAccountAlertSettings !== 'function') return [];
    const entries = getAccountAlertSettings(id);
    if (entries.length === 1) {
      const [combined] = entries;
      return [
        {
          ...combined,
          id: 'mobile',
          icon: BellIcon,
          title: combined.value
            ? t('profile.notifications.my_notifications')
            : t('profile.notifications.no_notifications'),
        },
      ];
    }
    const [sms, email, services] = entries;
    return [
      { ...sms, id: 'sms', icon: MobileIcon },
      { ...email, id: 'email', icon: PaperplaneIcon },
      { ...services, id: 'services', icon: BellIcon },
    ];
  };

  const getCompanySettings = (id: string): SettingsItemProps[] => {
    return [
      ...getNotificationsSettings(id),
      {
        id: 'orgNr',
        groupId: 'orgNr',
        icon: HashtagIcon,
        as: 'div',
        title: t('profile.organization_number'),
        value: formatNorwegianId(id),
        controls: (
          <Button
            as="button"
            size="xs"
            variant="ghost"
            onClick={() => {
              void navigator.clipboard.writeText(formatNorwegianId(id, false)).then(() => {
                openSnackbar({
                  message: t('word.copied'),
                  color: 'company',
                  duration: SnackbarDuration.short,
                });
              });
            }}
          >
            <FilesIcon />
            <span>{t('word.copy')}</span>
          </Button>
        ),
      },
    ];
  };

  const getPersonSettings = (party: PartyFieldsFragment): SettingsItemProps[] => {
    return [
      ...getNotificationsSettings(party.party),
      {
        id: 'born',
        icon: HashtagIcon,
        title: t('profile.born'),
        value: formatDate(party.dateOfBirth ?? undefined),
      },
    ];
  };

  const getOrganizationAccounts = (
    currentParty: { party: string } | undefined,
    parentParty: PartyFieldsFragment | undefined,
  ) => {
    const rootParty = parentParty ?? partyGraph.partyByUrn.get(currentParty?.party ?? '');
    if (!rootParty) return [];

    const item = {
      party: rootParty.party,
      name: rootParty.name,
      isDeleted: rootParty.isDeleted,
      subParties:
        'subParties' in rootParty
          ? ((rootParty as PartyFieldsFragment).subParties ?? []).map((sp) => ({
              party: sp.party,
              name: sp.name,
              isDeleted: sp.isDeleted,
            }))
          : undefined,
    };

    return [createOrganizationItem(item, currentParty)];
  };

  const mapAccountToPartyListItem = (account: PartyItemProp): SettingsItemProps => {
    const { label: _, variant: __, ...party } = account;
    const itemId = account.id + account.groupId;
    const accountType = party.type === 'subunit' ? 'company' : party.type;
    const isExpanded = expandedItem === itemId;
    const contextMenuProps: ContextMenuProps = {
      placement: 'right',
      id: party.groupId + party.id + '-menu',
      items: [
        {
          id: party.groupId + 'inbox',
          groupId: 'inbox',
          icon: InboxIcon,
          ...getGoToInboxButton({
            party: party.id,
            isCurrentEndUser: party.isCurrentEndUser ?? false,
          }),
        },
        ...(!party.isCurrentEndUser
          ? [
              party.isPreselectedParty
                ? {
                    id: party.groupId + 'set-preselected-party',
                    icon: HouseHeartFillIcon,
                    onClick: () =>
                      setOpenConfirmSetPreselectedActorModal({
                        party,
                        operation: 'unset',
                      }),
                    title: t('profile.unset_preselected_party'),
                    as: 'button' as ElementType,
                  }
                : {
                    id: party.groupId + 'unset-preselected-party',
                    icon: HouseHeartIcon,
                    onClick: () => setOpenConfirmSetPreselectedActorModal({ party, operation: 'set' }),
                    title: t('profile.set_preselected_party'),
                    as: 'button' as ElementType,
                  },
            ]
          : []),
      ],
    };

    const currentPartyForDetails = isExpanded ? partyGraph.partyByUrn.get(party.id) : undefined;

    return {
      id: party.id,
      icon: party.icon,
      description: isExpanded ? undefined : party.description,
      variant: 'accordion',
      groupId: String(party.groupId),
      collapsible: true,
      expanded: isExpanded,
      onClick: () => toggleExpanded(itemId),
      badge: undefined,
      highlightWords: (searchValue ?? '').split(' '),
      as: 'button' as ElementType,
      title: party.name,
      children: currentPartyForDetails ? (
        <PartyDetails
          type={accountType as AccountListItemType}
          currentParty={currentPartyForDetails}
          settings={settings}
          getGoToInboxButton={getGoToInboxButton}
          getCompanySettings={getCompanySettings}
          getPersonSettings={getPersonSettings}
          getOrganizationAccounts={getOrganizationAccounts}
          parentParty={partyGraph.parentByChildUrn.get(party.id)}
        />
      ) : null,
      controls: (
        <>
          {party.isCurrentEndUser && party?.badge && <Badge {...party.badge} />}
          {!party.isCurrentEndUser && party.isPreselectedParty && (
            <Button
              size="xs"
              variant="ghost"
              rounded
              aria-label={t('profile.unset_preselected_party')}
              onClick={() => setOpenConfirmSetPreselectedActorModal({ party, operation: 'unset' })}
            >
              <HouseHeartFillIcon />
            </Button>
          )}
          {!party.isCurrentEndUser && !party.isPreselectedParty && (
            <Button
              size="xs"
              variant="ghost"
              rounded
              aria-label={
                party.isFavorite
                  ? t('profile.remove_favorite', { name: party.name })
                  : t('profile.add_favorite', { name: party.name })
              }
              onClick={() => onToggleFavourite(party.uuid, party.isFavorite)}
            >
              {party.isFavorite ? <HeartFillIcon /> : <HeartIcon />}
            </Button>
          )}
          <ContextMenu {...contextMenuProps} />
        </>
      ),
    };
  };

  const totalPages = Math.max(1, Math.ceil(accountsTotal / PAGE_SIZE));

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setCurrentPage(1);
  }, [isSearching, deferredSearchValue, filterState, includeDeletedParties]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-map only when the page contents or expansion changes
  const pagedItems = useMemo((): SettingsListProps['items'] => {
    const isCompaniesFilter = filterState?.partyScope?.[0] === 'COMPANIES';
    const search = deferredSearchValue.trim().toLowerCase();
    const endUserMatchesSearch = (a: PartyItemProp) =>
      !search || a.name.toLowerCase().includes(search) || a.id.toLowerCase().includes(search);
    const visibleAccounts = accounts.filter((a) => {
      if (!a.isCurrentEndUser) return true;
      if (isCompaniesFilter) return false;
      return endUserMatchesSearch(a);
    });
    const mapped = visibleAccounts.map(mapAccountToPartyListItem);
    return isSearching ? mapped.map((a) => ({ ...a, groupId: 'search' })) : mapped;
  }, [accounts, isSearching, expandedItem, searchValue, filterState, deferredSearchValue]);

  const searchGroup = useMemo(
    () => ({ search: { title: t('search.hits', { count: pagedItems.length }) } }),
    [pagedItems.length, t],
  );

  const { pages, prevButtonProps, nextButtonProps } = useDsPagination({
    currentPage,
    setCurrentPage,
    totalPages,
    showPages: 7,
  });

  return (
    <PageBase color="person">
      <Section as="header" spacing={6}>
        <Heading as="h1" size="xl">
          {t('sidebar.profile.parties')}
        </Heading>
        <Toolbar>
          <ToolbarSearch
            name="party-search"
            label={t('parties.search.label')}
            hideLabel
            placeholder={t('inbox.search.placeholder')}
            value={searchValue}
            onChange={(e) => setSearchValue((e.target as HTMLInputElement).value)}
            onClear={() => setSearchValue('')}
          />
          <ToolbarFilter
            getFilterLabel={getFilterLabel}
            filterState={filterState}
            onFilterStateChange={setFilterState}
            filters={filters}
            addLabel={t('filter_bar.add_filter')}
          />
          {filterState?.partyScope?.[0] !== 'PERSONS' && (
            <Switch
              size="sm"
              checked={includeDeletedParties}
              onChange={(e) => updateShowDeletedEntities(e.target.checked)}
              aria-checked={includeDeletedParties}
              label={t('parties.filter.show_deleted')}
              className={styles.deletedFilter}
            />
          )}
        </Toolbar>
        {isSearching && pagedItems.length === 0 ? (
          <Heading as="h2" size="lg">
            {t('profile.settings.no_results')}
          </Heading>
        ) : (
          <SettingsList groups={isSearching ? searchGroup : accountGroups} items={pagedItems} />
        )}
        {totalPages > 1 && (
          <DsPagination aria-label={t('parties.pagination.aria_label', 'Sidenavigering')}>
            <DsPagination.List>
              <DsPagination.Item>
                <DsPagination.Button {...prevButtonProps} aria-label={t('parties.pagination.previous', 'Forrige side')}>
                  {t('parties.pagination.previous_short', 'Forrige')}
                </DsPagination.Button>
              </DsPagination.Item>
              {pages.map(({ page, itemKey, buttonProps }) => (
                <DsPagination.Item key={itemKey}>
                  {typeof page === 'number' && buttonProps && (
                    <DsPagination.Button
                      {...buttonProps}
                      aria-label={t('parties.pagination.page', { defaultValue: 'Side {{page}}', page })}
                    >
                      {page}
                    </DsPagination.Button>
                  )}
                </DsPagination.Item>
              ))}
              <DsPagination.Item>
                <DsPagination.Button {...nextButtonProps} aria-label={t('parties.pagination.next', 'Neste side')}>
                  {t('parties.pagination.next_short', 'Neste')}
                </DsPagination.Button>
              </DsPagination.Item>
            </DsPagination.List>
          </DsPagination>
        )}
      </Section>
      <ConfirmSetPreselectedActorModal
        showActor={openConfirmSetPreselectedActorModal}
        onClose={() => setOpenConfirmSetPreselectedActorModal(null)}
        onConfirm={async (partyUuid: string, operationType: PreselectedPartyOperationType) => {
          await setPreSelectedParty(partyUuid, operationType);
        }}
      />
    </PageBase>
  );
};
