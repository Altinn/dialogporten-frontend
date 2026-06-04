import {
  type AccountMenuItemProps,
  type AccountSearchProps,
  type AvatarGroupProps,
  type AvatarType,
  type BadgeProps,
  type MenuItemGroups,
  formatDate,
} from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import i18n from 'i18next';
import { type ChangeEvent, type ReactNode, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MAX_DIALOG_PARTY_SIZE } from '../../../api/hooks/useDialogs.tsx';
import { QUERY_KEYS } from '../../../constants/queryKeys.ts';
import { FixedGlobalQueryParams } from '../../../pages/Inbox/queryParams.ts';
import { useProfile } from '../../../pages/Profile';
import { SettingsType } from '../../../pages/Profile/useSettings.tsx';
import type { PageRoutes } from '../../../pages/routes.ts';
import type { PartyGraph } from '../../../utils/partyGraph.ts';

interface UseAccountOptions {
  showDescription?: boolean;
  showFavorites?: boolean;
  showGroups?: boolean;
  groups?: Record<string, { title?: string | ReactNode }>;
  excludeDeleted?: boolean;
  /**
   * When provided, only the slice of bulk parties (after end-user + favorites) is materialized
   * into PartyItemProp. The full count is returned via `accountsTotal`.
   */
  pagination?: { offset: number; limit: number };
}

export interface PartyItemProp extends AccountMenuItemProps {
  uuid: string;
  altinnId: number;
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
  partyGraph: PartyGraph;
  setSelectedPartyIds: (parties: string[], allOrganizationsSelected: boolean) => void;
}

interface UseAccountsOutput {
  accounts: PartyItemProp[];
  accountGroups: MenuItemGroups;
  accountSearch: AccountSearchProps | undefined;
  filterAccount?: (item: AccountMenuItemProps, search: string) => boolean;
  onSelectAccount: (account: string, route: PageRoutes) => void;
  currentAccountName: string;
  accountsTotal: number;
  searchable: boolean;
}

export const getOrgNo = (partyId: string): string => {
  if (!partyId.includes('urn:altinn:organization:')) return '';
  const parts = partyId.split('identifier-no:');
  return parts[1] ?? '';
};

export const formatNorwegianId = (partyId: string, includeThinSpace?: boolean): string => {
  const orgNo = getOrgNo(partyId);
  if (!orgNo) return '';
  const thinSpaceIncluded = includeThinSpace ?? true;
  if (thinSpaceIncluded) {
    return [orgNo.slice(0, 3), orgNo.slice(3, 6), orgNo.slice(6, 9)].join('\u2009');
  }
  return orgNo.slice(0, 9);
};

/** Reuse a single Intl.Collator per language – much faster than localeCompare per call */
let collatorLang = '';
let collator: Intl.Collator;
const getCollator = (): Intl.Collator => {
  if (collatorLang !== i18n.language) {
    collatorLang = i18n.language;
    collator = new Intl.Collator(i18n.language, { sensitivity: 'base' });
  }
  return collator;
};
const compareName = (a: string, b: string) => getCollator().compare(a, b);

export const useAccounts = ({
  parties,
  selectedParties,
  allOrganizationsSelected,
  options: inputOptions,
  isLoading,
  availableParties: _availableParties,
  partyGraph,
  setSelectedPartyIds,
}: UseAccountsProps): UseAccountsOutput => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, favoritesGroup, shouldShowDeletedEntities } = useProfile();
  const [searchString, setSearchString] = useState<string>('');
  const queryClient = useQueryClient();
  const SHOW_SEARCH_THRESHOLD = 5;

  const loadingAccountMenuItem: AccountMenuItemProps = {
    id: 'loading-account',
    type: 'person' as AccountMenuItemProps['type'],
    groupId: 'loading',
    title: '',
    icon: { name: '', type: 'person' },
    name: '',
  };

  const otherPeople = useMemo(
    () =>
      parties.filter(
        (party) => (party.partyType === 'Person' || party.partyType === 'SelfIdentified') && !party.isCurrentEndUser,
      ),
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

  const preselectedPartyUuid = user?.profileSettingPreference?.preselectedPartyUuid;
  const isPaginated = !!inputOptions?.pagination;

  // Cheap skeleton: sorted PartyFieldsFragment refs. No PartyItemProp allocation here.
  const personSkeleton = useMemo<PartyFieldsFragment[]>(() => {
    return [...otherPeople].sort((a, b) => compareName(a.name, b.name));
  }, [otherPeople]);

  type OrgSkeletonItem = { party: PartyFieldsFragment; isParent: boolean; parent?: PartyFieldsFragment };

  // Cheap skeleton: sorted+grouped org refs.
  const orgSkeleton = useMemo<OrgSkeletonItem[]>(() => {
    const items: OrgSkeletonItem[] = organizations.map((party) => {
      const matchInAvailable = partyGraph.partyByUrn.get(party.party);
      const isParent = Array.isArray(matchInAvailable?.subParties);
      const parent = isParent ? undefined : partyGraph.parentByChildUrn.get(party.party);
      return { party, isParent, parent };
    });

    const parents = items.filter((i) => i.isParent).sort((a, b) => compareName(a.party.name, b.party.name));
    const childrenByParentParty = new Map<string, OrgSkeletonItem[]>();
    const orphans: OrgSkeletonItem[] = [];

    for (const item of items) {
      if (item.isParent) continue;
      if (item.parent) {
        const arr = childrenByParentParty.get(item.parent.party) ?? [];
        arr.push(item);
        childrenByParentParty.set(item.parent.party, arr);
      } else {
        orphans.push(item);
      }
    }
    for (const arr of childrenByParentParty.values()) arr.sort((a, b) => compareName(a.party.name, b.party.name));
    orphans.sort((a, b) => compareName(a.party.name, b.party.name));

    const grouped = parents.flatMap((p) => [p, ...(childrenByParentParty.get(p.party.party) ?? [])]);
    return [...grouped, ...orphans];
  }, [organizations, partyGraph]);

  // Pure mappers. No favorite/preselect deps here — applied as a cheap overlay after.
  const mapPerson = useCallback(
    (person: PartyFieldsFragment): PartyItemProp => {
      const birthDate = formatDate(person.dateOfBirth ?? undefined);
      return {
        id: person.party,
        searchWords: [person.name],
        name: person.name,
        title: person.name,
        type: 'person' as AccountMenuItemProps['type'],
        icon: { name: person.name, type: 'person' as AvatarType },
        isDeleted: person.isDeleted,
        isCurrentEndUser: false,
        uuid: person.partyUuid,
        altinnId: person.partyId,
        description: options.showDescription && birthDate ? t('word.born') + birthDate : undefined,
        badge: person.isDeleted ? { color: 'neutral', label: t('badge.deleted'), variant: 'subtle' } : undefined,
        groupId: 'persons',
      } as PartyItemProp;
    },
    [options.showDescription, t],
  );

  const mapOrgItem = useCallback(
    (item: OrgSkeletonItem): PartyItemProp => {
      const { party, isParent, parent } = item;
      const orgNo = getOrgNo(party.party);
      const formattedId = formatNorwegianId(party.party);
      const description = options.showDescription
        ? parent?.name && party?.party
          ? `↳ ${t('word.orgNo')} ${formattedId}, ${t('profile.account.partOf')} ${parent.name}`
          : `${t('word.orgNo')} ${formattedId}`
        : undefined;
      return {
        id: party.party,
        searchWords: [orgNo, party.name],
        ssnOrOrgNo: orgNo,
        name: party.name,
        title: party.name,
        type: 'company' as AccountMenuItemProps['type'],
        icon: { name: party.name, type: 'company' as AvatarType, isParent, isDeleted: party.isDeleted },
        isDeleted: party.isDeleted,
        isCurrentEndUser: false,
        uuid: party.partyUuid,
        disabled: party.hasOnlyAccessToSubParties,
        isParent,
        parentId: parent?.party,
        parentName: parent?.name,
        description,
        badge: party.isDeleted ? { color: 'neutral', label: t('badge.deleted'), variant: 'subtle' } : undefined,
        groupId: parent?.party ?? party.party,
      } as PartyItemProp;
    },
    [options.showDescription, t],
  );

  const applyFlags = useCallback(
    (acc: PartyItemProp): PartyItemProp => {
      const isPreselectedParty = acc.uuid === preselectedPartyUuid;
      const isFavorite = favoritesSet.has(acc.uuid) || isPreselectedParty;
      if (!isFavorite && !isPreselectedParty) return acc;
      return { ...acc, isFavorite, isPreselectedParty };
    },
    [favoritesSet, preselectedPartyUuid],
  );

  // Full materialization only when NOT paginated. Used by existing consumers.
  const otherPeopleAccounts = useMemo<PartyItemProp[]>(() => {
    if (isPaginated) return [];
    return personSkeleton.map((p) => applyFlags(mapPerson(p)));
  }, [isPaginated, personSkeleton, mapPerson, applyFlags]);

  const organizationAccounts = useMemo<PartyItemProp[]>(() => {
    if (isPaginated) return [];
    return orgSkeleton.map((item) => applyFlags(mapOrgItem(item)));
  }, [isPaginated, orgSkeleton, mapOrgItem, applyFlags]);

  const currentEndUser = partyGraph.currentEndUser;

  const shouldExcludeDeleted = options.excludeDeleted ?? true;
  const includeDeletedParties = shouldShowDeletedEntities ?? false;

  // Memoize org count and avatar group items separately — avoids recomputation when only selection changes.
  // Reads from the cheap orgSkeleton instead of materialized organizationAccounts.
  const { orgCount, avatarGroupItems } = useMemo(() => {
    const filtered = orgSkeleton.filter(({ party }) => {
      if (party.hasOnlyAccessToSubParties) return false;
      if (shouldExcludeDeleted && !includeDeletedParties && party.isDeleted) return false;
      return true;
    });

    return {
      orgCount: filtered.length,
      avatarGroupItems: filtered.slice(0, MAX_DIALOG_PARTY_SIZE).map(({ party, isParent }) => ({
        id: party.party,
        name: party.name,
        type: 'company' as AccountMenuItemProps['type'],
        variant: isParent ? 'solid' : 'outline',
      })),
    };
  }, [orgSkeleton, shouldExcludeDeleted, includeDeletedParties]);

  // Total bulk count (excluding favorites + end user). Used for pagination UI.
  const accountsTotal = useMemo(() => {
    if (!shouldExcludeDeleted || includeDeletedParties) {
      return personSkeleton.length + orgSkeleton.length;
    }
    let count = 0;
    for (const p of personSkeleton) if (!p.isDeleted) count++;
    for (const o of orgSkeleton) if (!o.party.isDeleted) count++;
    return count;
  }, [personSkeleton, orgSkeleton, shouldExcludeDeleted, includeDeletedParties]);

  // Memoize the full account assembly to avoid O(n) work on every render
  const { assembledAccounts, accountGroups } = useMemo(() => {
    if (!selectedParties?.length) {
      return { assembledAccounts: [] as PartyItemProp[], accountGroups: {} as MenuItemGroups };
    }

    const firstOrgPartyUrn = orgSkeleton[0]?.party.party;
    const groups = {
      ...options.groups,
      ...(firstOrgPartyUrn && options.groups?.companies ? { [firstOrgPartyUrn]: options.groups?.companies } : {}),
    } as MenuItemGroups;

    const birthDate = formatDate(currentEndUser?.dateOfBirth ?? undefined);
    const desc = birthDate ? t('word.born') + birthDate : '';
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
          altinnId: currentEndUser.partyId ?? 0,
          description: options.showDescription ? desc : undefined,
          badge: { color: 'person', label: t('badge.you') },
        }
      : undefined;

    const allOrganizationsAccount: PartyItemProp = {
      uuid: 'N/A',
      altinnId: -1,
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

    const selectedUrn = allOrganizationsSelected ? null : (selectedParties[0]?.party ?? null);
    const excludeDeleted = shouldExcludeDeleted && !includeDeletedParties;

    // Favorites — always materialized (small set). Scan skeletons by uuid.
    const favorites: PartyItemProp[] = [];
    if (options.showFavorites) {
      for (const p of personSkeleton) {
        const isPreselected = p.partyUuid === preselectedPartyUuid;
        if (favoritesSet.has(p.partyUuid) || isPreselected) {
          const mapped = mapPerson(p);
          favorites.push({
            ...mapped,
            isFavorite: true,
            isPreselectedParty: isPreselected,
            groupId: SettingsType.favorites,
            selected: mapped.id === selectedUrn,
          });
        }
      }
      for (const item of orgSkeleton) {
        const isPreselected = item.party.partyUuid === preselectedPartyUuid;
        if (favoritesSet.has(item.party.partyUuid) || isPreselected) {
          const mapped = mapOrgItem(item);
          favorites.push({
            ...mapped,
            isFavorite: true,
            isPreselectedParty: isPreselected,
            groupId: SettingsType.favorites,
            selected: mapped.id === selectedUrn,
          });
        }
      }
    }

    const result: PartyItemProp[] = [];
    if (endUserAccount) result.push(endUserAccount);
    for (const f of favorites) result.push(f);
    if (options.showGroups && orgSkeleton.length > 1) result.push(allOrganizationsAccount);

    if (isPaginated) {
      // Build bulk list filtered for deleted, then materialize only the slice.
      const bulkPeople: PartyFieldsFragment[] = [];
      for (const p of personSkeleton) if (!excludeDeleted || !p.isDeleted) bulkPeople.push(p);
      const bulkOrgs: OrgSkeletonItem[] = [];
      for (const o of orgSkeleton) if (!excludeDeleted || !o.party.isDeleted) bulkOrgs.push(o);

      const offset = options.pagination?.offset ?? 0;
      const limit = options.pagination?.limit ?? 0;
      const end = offset + limit;
      let cursor = 0;

      const takeFrom = <T,>(arr: T[], mapper: (x: T) => PartyItemProp) => {
        const arrStart = cursor;
        const arrEnd = cursor + arr.length;
        if (arrEnd > offset && arrStart < end) {
          const sliceFrom = Math.max(0, offset - arrStart);
          const sliceTo = Math.min(arr.length, end - arrStart);
          for (let i = sliceFrom; i < sliceTo; i++) {
            const mapped = applyFlags(mapper(arr[i]));
            result.push(mapped.id === selectedUrn ? { ...mapped, selected: true } : mapped);
          }
        }
        cursor = arrEnd;
      };

      takeFrom(bulkPeople, mapPerson);
      takeFrom(bulkOrgs, mapOrgItem);
    } else {
      for (const a of otherPeopleAccounts) {
        if (excludeDeleted && a.isDeleted) continue;
        result.push(a.id === selectedUrn ? { ...a, selected: true } : a);
      }
      for (const a of organizationAccounts) {
        if (excludeDeleted && a.isDeleted) continue;
        result.push(a.id === selectedUrn ? { ...a, selected: true } : a);
      }
    }

    return { assembledAccounts: result, accountGroups: groups };
  }, [
    selectedParties,
    allOrganizationsSelected,
    isPaginated,
    options.pagination?.offset,
    options.pagination?.limit,
    organizationAccounts,
    otherPeopleAccounts,
    personSkeleton,
    orgSkeleton,
    favoritesSet,
    preselectedPartyUuid,
    mapPerson,
    mapOrgItem,
    applyFlags,
    currentEndUser,
    options.groups,
    options.showDescription,
    options.showFavorites,
    options.showGroups,
    shouldExcludeDeleted,
    includeDeletedParties,
    orgCount,
    avatarGroupItems,
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
          const party = partyGraph.partyByUrn.get(partyId);
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
    [selectedParties, queryClient, setSelectedPartyIds, partyGraph, navigate],
  );

  const showSearch = assembledAccounts.length > SHOW_SEARCH_THRESHOLD;

  const accountSearch = useMemo(
    () =>
      showSearch
        ? {
            name: 'account-search',
            value: searchString,
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
              setSearchString(event.target.value);
            },
            placeholder: t('inbox.search.placeholder'),
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
      accountsTotal: 0,
      searchable: false,
    };
  }

  if (!selectedParties?.length) {
    return {
      accounts: [],
      accountGroups: {},
      accountSearch: undefined,
      onSelectAccount,
      currentAccountName: '',
      accountsTotal: 0,
      searchable: false,
    };
  }

  return {
    accounts: assembledAccounts,
    searchable: showSearch,
    accountGroups,
    accountSearch,
    onSelectAccount,
    accountsTotal,
    currentAccountName: allOrganizationsSelected
      ? t('parties.labels.all_organizations')
      : (selectedParties?.[0]?.name ?? ''),
  };
};
