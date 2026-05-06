import {
  AccountList,
  AccountListItemDetails,
  type AccountListItemProps,
  type AccountListItemType,
  type AccountOrganizationItemProps,
  type AvatarType,
  type AvatarVariant,
  Badge,
  Button,
  Heading,
  PageBase,
  Section,
  type SettingsItemProps,
  SnackbarDuration,
  Switch,
  Toolbar,
  useSnackbar,
} from '@altinn/altinn-components';
import {
  BellIcon,
  FilesIcon,
  HashtagIcon,
  HouseHeartFillIcon,
  HouseHeartIcon,
  InboxIcon,
  MobileIcon,
  PaperplaneIcon,
} from '@navikt/aksel-icons';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { type ElementType, useDeferredValue, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps } from 'react-router-dom';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import {
  type PartyItemProp,
  formatNorwegianId,
  useAccounts,
} from '../../../components/PageLayout/Accounts/useAccounts';
import { useFeatureFlag } from '../../../featureFlags';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { PageRoutes } from '../../routes.ts';
import { useSettings } from '../Settings/useSettings.tsx';
import { useAccountFilters } from '../useAccountFilters.tsx';
import { ConfirmSetPreselectedActorModal } from './ConfirmSetPreselectedActorModal.tsx';
import styles from './partiesOverviewPage.module.css';

interface PartyDetailsProps {
  type: AccountListItemType;
  currentParty: PartyFieldsFragment;
  settings: SettingsItemProps[];
  getGoToInboxButton: (party: { party: string; isCurrentEndUser: boolean }) => {
    label: string;
    [key: string]: unknown;
  };
  getCompanySettings: (id: string) => SettingsItemProps[];
  getPersonSettings: (id: string, isCurrentEndUser: boolean) => SettingsItemProps[];
  getOrganizationAccounts: (
    currentParty: { party: string } | undefined,
    parentParty: PartyFieldsFragment | undefined,
  ) => AccountOrganizationItemProps[];
  parentParty: PartyFieldsFragment | undefined;
}

const PartyDetails = ({
  type,
  currentParty,
  settings,
  getGoToInboxButton,
  getCompanySettings,
  getPersonSettings,
  getOrganizationAccounts,
  parentParty,
}: PartyDetailsProps) => {
  const organizationAccounts = useMemo(() => {
    if (type !== 'company') return undefined;
    return getOrganizationAccounts(currentParty, parentParty);
  }, [type, currentParty, parentParty, getOrganizationAccounts]);

  if (currentParty.isCurrentEndUser) {
    const contactSettings = settings.filter((s) => s.groupId === 'contact');
    return (
      <AccountListItemDetails color="person" buttons={[getGoToInboxButton(currentParty)]} settings={contactSettings} />
    );
  }

  if (type === 'company') {
    const companySettings = getCompanySettings(currentParty.party);
    return (
      <AccountListItemDetails
        color="company"
        settings={companySettings}
        buttons={[getGoToInboxButton(currentParty)]}
        organization={organizationAccounts}
      />
    );
  }

  if (type === 'person') {
    return (
      <AccountListItemDetails
        color="person"
        settings={getPersonSettings(currentParty.party, currentParty.isCurrentEndUser)}
        buttons={[getGoToInboxButton(currentParty)]}
      />
    );
  }

  return null;
};

export type PreselectedPartyOperationType = 'set' | 'unset';

export type PreselectedActorModalProps = {
  party?: PartyItemProp;
  operation: PreselectedPartyOperationType;
};

export const PartiesOverviewPage = () => {
  const { t } = useTranslation();
  const {
    isSelfIdentifiedUser,
    parties,
    selectedParties,
    allOrganizationsSelected,
    isLoading,
    partyGraph,
    setSelectedPartyIds,
  } = useParties();
  const { getAccountAlertSettings, settings } = useSettings({
    disabled: isSelfIdentifiedUser,
    isSelfIdentifiedUser,
  });
  const isDeletedUnitsFilterEnabled = useFeatureFlag<boolean>('inbox.enableDeletedUnitsFilter');
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

  const includeDeletedParties = isDeletedUnitsFilterEnabled ? (shouldShowDeletedEntities ?? false) : true;

  const { filters, getFilterLabel, filterState, setFilterState, filteredParties, isSearching } = useAccountFilters({
    searchValue: deferredSearchValue,
    parties,
    includeDeletedParties: true,
  });

  const { accounts, accountGroups } = useAccounts({
    parties: filteredParties,
    availableParties: parties,
    selectedParties,
    allOrganizationsSelected,
    isLoading,
    partyGraph,
    setSelectedPartyIds,
    options: {
      showFavorites: !isSearching,
    },
  });

  usePageTitle({ baseTitle: t('component.parties_settings') });

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
              setSelectedPartyIds([party.party], false);
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
        icon: HashtagIcon,
        as: 'button',
        title: t('profile.organization_number'),
        onClick: () => {
          void navigator.clipboard.writeText(formatNorwegianId(id, false, false)).then(() => {
            openSnackbar({
              message: t('word.copied'),
              color: 'company',
              duration: SnackbarDuration.short,
            });
          });
        },
        value: formatNorwegianId(id, false),
        controls: (
          <Button as="div" size="xs" variant="ghost">
            <FilesIcon />
            <span>{t('word.copy')}</span>
          </Button>
        ),
      },
    ];
  };

  const getPersonSettings = (id: string, isCurrentEndUser: boolean): SettingsItemProps[] => {
    return [
      ...getNotificationsSettings(id),
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
    parentParty: PartyFieldsFragment | undefined,
  ) => {
    const rootParty = parentParty ?? partyGraph.partyByUrn.get(currentParty?.party ?? '');
    if (!rootParty) return [];

    const items = [rootParty, ...(rootParty.subParties ?? [])].map((item) => ({
      party: item.party,
      name: item.name,
      isDeleted: item.isDeleted,
      parentId: rootParty.party !== item.party ? rootParty.partyUuid : undefined,
      subParties:
        'subParties' in item
          ? ((item as PartyFieldsFragment).subParties ?? []).map((sp) => ({
              party: sp.party,
              name: sp.name,
              isDeleted: sp.isDeleted,
            }))
          : undefined,
    }));

    return items.map((item) => createOrganizationItem(item, currentParty));
  };

  const mapAccountToPartyListItem = (account: PartyItemProp): AccountListItemProps => {
    const { label: _, variant: __, ...party } = account;
    const itemId = account.id + account.groupId;
    const accountType = party.type === 'subunit' ? 'company' : party.type;

    return {
      ...party,
      isPreselectedParty: party.isPreselectedParty ?? false,
      type: accountType as AccountListItemType,
      favourite: party.isFavorite,
      groupId: String(party.groupId),
      isCurrentEndUser: party.isCurrentEndUser,
      isDeleted: party.isDeleted,
      collapsible: true,
      expanded: expandedItem === itemId,
      onClick: () => toggleExpanded(itemId),
      highlightWords: (searchValue ?? '').split(' '),
      as: 'button' as ElementType,
      title: party.name,
      onToggleFavourite: () => onToggleFavourite(party.uuid, party.isFavorite),
      children: partyGraph.partyByUrn.get(party.id) ? (
        <PartyDetails
          type={accountType as AccountListItemType}
          currentParty={partyGraph.partyByUrn.get(party.id) as PartyFieldsFragment}
          settings={settings}
          getGoToInboxButton={getGoToInboxButton}
          getCompanySettings={getCompanySettings}
          getPersonSettings={getPersonSettings}
          getOrganizationAccounts={getOrganizationAccounts}
          parentParty={partyGraph.parentByChildUrn.get(party.id)}
        />
      ) : null,
      badge: (
        <>
          {party.badge && <Badge {...party.badge} />}
          {party.isPreselectedParty && (
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
        </>
      ),
      contextMenu: {
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
      },
    };
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const accountListItems = useMemo(() => accounts.map(mapAccountToPartyListItem), [accounts]);

  const displayHits = useMemo(() => {
    if (!isSearching) return accountListItems;
    return accountListItems.map((a) => ({ ...a, groupId: 'search' }));
  }, [accountListItems, isSearching]);

  const searchGroup = useMemo(
    () => ({ search: { title: t('search.hits', { count: displayHits.length }) } }),
    [displayHits.length, t],
  );

  return (
    <PageBase color="person">
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
          filter={{
            getFilterLabel,
            filterState,
            onFilterStateChange: setFilterState,
            filters,
          }}
        >
          {isDeletedUnitsFilterEnabled && filterState?.partyScope?.[0] !== 'PERSONS' && (
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
        {isSearching && displayHits.length === 0 && <Heading size="lg">{t('profile.settings.no_results')}</Heading>}
        <AccountList
          virtualized
          groups={isSearching ? searchGroup : accountGroups}
          items={isSearching ? displayHits : accountListItems}
        />
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
