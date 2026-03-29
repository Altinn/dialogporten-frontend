import type {
  AccountMenuItemProps,
  AccountSearchProps,
  AvatarGroupProps,
  AvatarType,
  BadgeProps,
  MenuItemGroups,
} from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import i18n from 'i18next';
import { type ChangeEvent, type ReactNode, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import type { PartyGraph } from '../../../api/utils/partyGraph.ts';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../../featureFlags';
import { FixedGlobalQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { useProfile } from '../../../pages/Profile';
import { SettingsType } from '../../../pages/Profile/Settings/useSettings.tsx';
import type { PageRoutes } from '../../../pages/routes.ts';

interface UseAccountOptions {
  showDescription?: boolean;
  showFavorites?: boolean;
  showGroups?: boolean;
  groups?: Record<string, { title?: string | ReactNode }>;
  excludeDeleted?: boolean;
}

export interface PartyItemProp extends AccountMenuItemProps {
  uuid: string;
  isPreselectedParty?: boolean;
  isDeleted?: boolean;
  parentId?: string | undefined;
  parentName?: string | undefined;
  isFavorite?: boolean;
  isCurrentEndUser?: boolean;
  badge?: BadgeProps;
  isParent?: boolean;
  ssnOrOrgNo?: string;
}

interface UseAccountsProps {
  parties: PartyFieldsFragment[];
  selectedParties: PartyFieldsFragment[];
  allOrganizationsSelected: boolean;
  options?: UseAccountOptions;
  isLoading?: boolean;
  availableParties?: PartyFieldsFragment[];
  /** Pre-built party graph to avoid duplicate O(n) graph construction. Falls back to useParties().partyGraph */
  partyGraph?: PartyGraph;
}

interface UseAccountsOutput {
  accounts: PartyItemProp[];
  accountGroups: MenuItemGroups;
  accountSearch: AccountSearchProps | undefined;
  filterAccount?: (item: AccountMenuItemProps, search: string) => boolean;
  onSelectAccount: (account: string, route: PageRoutes) => void;
  currentAccountName: string;
}

export const formatSSN = (ssn: string, maskIdentifierSuffix: boolean) => {
  if (maskIdentifierSuffix) {
    return ssn.slice(0, 6) + '\u2009' + 'XXXXX';
  }
  return ssn.slice(0, 6) + '\u2009' + ssn.slice(6);
};

export const getSSNOrOrgNo = (partyId: string) => {
  const parts = partyId.split('identifier-no:');
  if (parts.length < 2) return '';

  const ssnOrOrgNo = parts[1];
  return ssnOrOrgNo ?? '';
};

export const formatNorwegianId = (partyId: string, isCurrentEndUser: boolean) => {
  const ssnOrOrgNo = getSSNOrOrgNo(partyId);
  const isPerson = partyId.includes('person');

  if (!ssnOrOrgNo) return '';

  if (isPerson) {
    return formatSSN(ssnOrOrgNo, !isCurrentEndUser);
  }

  return [ssnOrOrgNo.slice(0, 3), ssnOrOrgNo.slice(3, 6), ssnOrOrgNo.slice(6, 9)].join('\u2009');
};

/** Reuse a single Intl.Collator per language – ~10-50x faster than localeCompare per call */
let _collatorLang = '';
let _collator: Intl.Collator;
const getCollator = (): Intl.Collator => {
  if (_collatorLang !== i18n.language) {
    _collatorLang = i18n.language;
    _collator = new Intl.Collator(i18n.language, { sensitivity: 'base' });
  }
  return _collator;
};
const compareName = (a: string, b: string) => getCollator().compare(a, b);

export const useAccounts = ({
  parties,
  selectedParties,
  allOrganizationsSelected,
  options: inputOptions,
  isLoading,
  availableParties: _availableParties,
  partyGraph: externalPartyGraph,
}: UseAccountsProps): UseAccountsOutput => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setSelectedPartyIds, partyGraph: hookPartyGraph } = useParties();
  const { user, favoritesGroup, shouldShowDeletedEntities } = useProfile();
  const isDeletedUnitsFilterEnabled = useFeatureFlag<boolean>('inbox.enableDeletedUnitsFilter');
  const [searchString, setSearchString] = useState<string>('');
  const queryClient = useQueryClient();
  const accountSearchThreshold = 2;
  const showSearch = parties.length > accountSearchThreshold;

  const loadingAccountMenuItem: AccountMenuItemProps = {
    id: 'loading-account',
    type: 'person' as AccountMenuItemProps['type'],
    groupId: 'loading',
    title: '',
    icon: { name: '', type: 'person' },
    name: '',
  };

  const otherPeople = useMemo(
    () => parties.filter((party) => party.partyType === 'Person' && !party.isCurrentEndUser),
    [parties],
  );

  const organizations = useMemo(() => parties.filter((party) => party.partyType === 'Organization'), [parties]);

  const defaultGroups = {
    primary: {
      title: t('profile.accounts.me_and_favorites'),
    },
    groups: { title: '' },
    persons: {
      title: t('profile.accounts.persons'),
    },
    companies: {
      title: t('profile.accounts.companies'),
    },
  };

  const defaultOptions: UseAccountOptions = {
    showDescription: true,
    showFavorites: true,
    showGroups: false,
    groups: defaultGroups,
  };

  const options = { ...defaultOptions, ...inputOptions };

  const favoritesSet = useMemo(() => new Set(favoritesGroup?.parties ?? []), [favoritesGroup?.parties]);

  const otherPeopleAccounts = useMemo<PartyItemProp[]>(() => {
    return otherPeople
      .map((person) => {
        const description = t('word.ssn') + formatNorwegianId(person.party, false);
        const isPreselectedParty = user?.profileSettingPreference?.preselectedPartyUuid === person.partyUuid;
        const ssnOrOrgNo = getSSNOrOrgNo(person.party);
        return {
          id: person.party,
          selected: !allOrganizationsSelected && person.party === selectedParties[0]?.party,
          searchWords: [person.name, ssnOrOrgNo],
          ssnOrOrgNo,
          name: person.name,
          title: person.name,
          type: 'person' as AccountMenuItemProps['type'],
          icon: { name: person.name, type: 'person' as AvatarType },
          isDeleted: person.isDeleted,
          isFavorite: favoritesSet.has(person.partyUuid) || isPreselectedParty,
          isPreselectedParty,
          isCurrentEndUser: false,
          uuid: person.partyUuid,
          description: options.showDescription ? description : undefined,
          badge: person.isDeleted ? { color: 'neutral', label: t('badge.deleted'), variant: 'subtle' } : undefined,
          groupId: 'persons',
        } as PartyItemProp;
      })
      .sort((a, b) => compareName(a.name, b.name));
  }, [allOrganizationsSelected, otherPeople, favoritesSet, options.showDescription, t, selectedParties, user]);

  const availablePartiesGraph = externalPartyGraph ?? hookPartyGraph;

  const currentEndUser = availablePartiesGraph.currentEndUser;

  const organizationAccounts = useMemo<PartyItemProp[]>(() => {
    const mapped = organizations.map((party) => {
      const matchInAvailable = availablePartiesGraph.partyByUrn.get(party.party);
      const isParent = Array.isArray(matchInAvailable?.subParties);
      const isPreselectedParty = user?.profileSettingPreference?.preselectedPartyUuid === party.partyUuid;

      const parent = isParent ? undefined : availablePartiesGraph.parentByChildUrn.get(party.party);

      const description =
        parent?.name && party?.party
          ? `↳ ${t('word.orgNo')} ${formatNorwegianId(
              party.party,
              false,
            )}, ${t('profile.account.partOf')} ${parent.name}`
          : `${t('word.orgNo')} ${formatNorwegianId(party.party, false)}`;
      const orgNo = getSSNOrOrgNo(party.party);
      return {
        id: party.party,
        selected: !allOrganizationsSelected && party.party === selectedParties[0]?.party,
        searchWords: [orgNo, party.name],
        ssnOrOrgNo: orgNo,
        name: party.name,
        title: party.name,
        type: 'company' as AccountMenuItemProps['type'],
        icon: {
          name: party.name,
          type: 'company' as AvatarType,
          isParent,
          isDeleted: party.isDeleted,
        },
        isDeleted: party.isDeleted,
        isFavorite: favoritesSet.has(party.partyUuid) || isPreselectedParty,
        isPreselectedParty,
        isCurrentEndUser: false,
        uuid: party.partyUuid,
        disabled: party.hasOnlyAccessToSubParties,
        isParent,
        parentId: parent?.party,
        parentName: parent?.name,
        description: options.showDescription ? description : undefined,
        badge: party.isDeleted ? { color: 'neutral', label: t('badge.deleted'), variant: 'subtle' } : undefined,
        groupId: parent?.party ?? party.party,
      } as PartyItemProp;
    });

    const parents = mapped.filter((x) => x.isParent).sort((a, b) => compareName(a.name, b.name));
    const childrenByParentId = new Map<string, PartyItemProp[]>();
    const children: PartyItemProp[] = [];

    for (const item of mapped) {
      if (item.isParent) continue;

      if (item.parentId) {
        const arr = childrenByParentId.get(item.parentId) ?? [];
        arr.push(item);
        childrenByParentId.set(item.parentId, arr);
      } else {
        children.push(item);
      }
    }

    for (const arr of childrenByParentId.values()) {
      arr.sort((a, b) => compareName(a.name, b.name));
    }
    children.sort((a, b) => compareName(a.name, b.name));

    const grouped = parents.flatMap((p) => [p, ...(childrenByParentId.get(p.id) ?? [])]);

    return [...grouped, ...children];
  }, [
    selectedParties,
    allOrganizationsSelected,
    organizations,
    availablePartiesGraph,
    favoritesSet,
    options.showDescription,
    t,
    user,
  ]);

  /** deleted units filtering - FF: "inbox.enableDeletedUnitsFilter"
   * FF off -> always include deleted parties
   * FF on, switch off -> exclude deleted parties
   * FF on, switch on -> include deleted parties
   */
  const shouldExcludeDeleted = options.excludeDeleted ?? true;
  const includeDeletedParties = isDeletedUnitsFilterEnabled ? (shouldShowDeletedEntities ?? false) : true;

  // Memoize the full account assembly to avoid O(n) work on every render
  const { assembledAccounts, accountGroups } = useMemo(() => {
    if (!selectedParties?.length) {
      return { assembledAccounts: [] as PartyItemProp[], accountGroups: {} as MenuItemGroups };
    }

    const groups = {
      ...options.groups,
      ...(organizationAccounts.length && options.groups?.companies
        ? { [organizationAccounts[0].id]: options.groups?.companies }
        : {}),
    } as MenuItemGroups;

    const norwegianId = currentEndUser?.party ? formatNorwegianId(currentEndUser.party, true) : '';
    const desc = currentEndUser?.party && norwegianId ? t('word.ssn') + norwegianId : '';

    const endUserAccount: PartyItemProp | undefined = currentEndUser
      ? {
          id: currentEndUser.party ?? '',
          selected: !allOrganizationsSelected && currentEndUser.party === selectedParties[0]?.party,
          searchWords: [currentEndUser.name],
          name: currentEndUser.name ?? '',
          title: currentEndUser.name ?? '',
          type: 'person' as AccountMenuItemProps['type'],
          groupId: 'primary',
          icon: { name: currentEndUser.name ?? '', type: 'person' as AvatarType },
          isCurrentEndUser: true,
          uuid: currentEndUser.partyUuid ?? '',
          description: options.showDescription ? desc : undefined,
          badge: { color: 'person', label: t('badge.you') },
        }
      : undefined;

    const orgCount =
      shouldExcludeDeleted && !includeDeletedParties
        ? organizationAccounts.reduce((n, org) => n + (org.isDeleted ? 0 : 1), 0)
        : organizationAccounts.length;

    /* Only map the first few items for the avatar group icon – the rest are never visible */
    const AVATAR_GROUP_LIMIT = 10;
    const avatarGroupSource =
      shouldExcludeDeleted && !includeDeletedParties
        ? organizationAccounts.filter((org) => !org.isDeleted)
        : organizationAccounts;
    const avatarGroupItems = avatarGroupSource.slice(0, AVATAR_GROUP_LIMIT).map((party) => ({
      id: party.id,
      name: party.name,
      type: 'company' as AccountMenuItemProps['type'],
      variant: party.isParent ? 'solid' : 'outline',
    }));

    const allOrganizationsAccount: PartyItemProp = {
      uuid: 'N/A',
      selected: allOrganizationsSelected,
      id: 'ALL',
      name: t('parties.labels.all_organizations'),
      title: t('parties.labels.all_organizations'),
      type: 'group',
      groupId: 'groups',
      icon: {
        type: 'group' as AccountMenuItemProps['type'],
        maxItemsCountReachedLabel: orgCount > 99 ? '..' : '',
        items: avatarGroupItems,
      } as AvatarGroupProps,
    };

    const favorites: PartyItemProp[] = [];
    for (const a of organizationAccounts) {
      if (a.isFavorite) favorites.push({ ...a, groupId: SettingsType.favorites });
    }
    for (const a of otherPeopleAccounts) {
      if (a.isFavorite) favorites.push({ ...a, groupId: SettingsType.favorites });
    }

    const result: PartyItemProp[] = [];
    if (endUserAccount) result.push(endUserAccount);
    if (options.showFavorites) {
      for (const f of favorites) result.push(f);
    }
    if (options.showGroups && organizationAccounts.length > 1) result.push(allOrganizationsAccount);
    for (const a of otherPeopleAccounts) result.push(a);
    for (const a of organizationAccounts) result.push(a);

    let finalAccounts = result;
    if (shouldExcludeDeleted && !includeDeletedParties) {
      finalAccounts = result.filter((item) => {
        if (item.groupId === SettingsType.favorites || item.groupId === 'primary') return true;
        return !item.isDeleted;
      });
    }

    return { assembledAccounts: finalAccounts, accountGroups: groups };
  }, [
    selectedParties,
    allOrganizationsSelected,
    organizationAccounts,
    otherPeopleAccounts,
    currentEndUser,
    options.groups,
    options.showDescription,
    options.showFavorites,
    options.showGroups,
    shouldExcludeDeleted,
    includeDeletedParties,
    t,
  ]);

  const onSelectAccount = useCallback(
    (partyId: string, route: PageRoutes) => {
      const search = new URLSearchParams(location.search);
      const isPersonAccount = partyId.includes('person');
      const isAllPartiesSelected = search.get('allParties') === 'true';
      const isCurrentAccount = partyId === selectedParties[0]?.party;

      if (isCurrentAccount && !isAllPartiesSelected) return;

      queryClient.setQueryData([QUERY_KEYS.SELECTED_SUB_ACCOUNTS], []);

      if (isPersonAccount) {
        setSelectedPartyIds([partyId], false);
      } else {
        if (partyId === 'ALL') {
          search.set(FixedGlobalQueryParams.allParties, 'true');
          search.delete(FixedGlobalQueryParams.party);
          search.delete(FixedGlobalQueryParams.subAccounts);
        } else {
          const party = availablePartiesGraph.partyByUrn.get(partyId);
          if (!party) {
            console.error('Selected party not found:', partyId);
            return;
          }
          search.set(FixedGlobalQueryParams.party, party.party);
          search.delete(FixedGlobalQueryParams.allParties);
          search.delete(FixedGlobalQueryParams.subAccounts);
        }
        navigate(`${route}?${search.toString()}`, { replace: true });
      }
    },
    [selectedParties, queryClient, setSelectedPartyIds, availablePartiesGraph, navigate],
  );

  const accountSearch = useMemo(
    () =>
      showSearch
        ? {
            name: 'account-search',
            value: searchString,
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
              setSearchString(event.target.value);
            },
            placeholder: t('parties.search'),
          }
        : undefined,
    [showSearch, searchString, t],
  );

  if (isLoading) {
    return {
      accounts: [loadingAccountMenuItem as PartyItemProp],
      accountGroups: { loading: { title: t('profile.accounts.loading') } },
      accountSearch: undefined,
      onSelectAccount,
      currentAccountName: '',
    };
  }

  if (!selectedParties?.length) {
    return {
      accounts: [],
      accountGroups: {},
      accountSearch: undefined,
      onSelectAccount,
      currentAccountName: '',
    };
  }

  return {
    accounts: assembledAccounts,
    accountGroups,
    accountSearch,
    onSelectAccount,
    currentAccountName: allOrganizationsSelected
      ? t('parties.labels.all_organizations')
      : (selectedParties?.[0]?.name ?? ''),
  };
};
