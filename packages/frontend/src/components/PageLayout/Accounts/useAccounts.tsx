import type {
  Account,
  AccountMenuItemProps,
  AccountSearchProps,
  AvatarGroupProps,
  AvatarType,
  BadgeProps,
  MenuItemGroups,
} from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { type ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import { getPartyIds } from '../../../api/utils/dialog.ts';
import { useProfile } from '../../../pages/Profile';
import { SettingsType } from '../../../pages/Profile/Settings/useSettings.tsx';
import type { PageRoutes } from '../../../pages/routes.ts';

interface UseAccountOptions {
  showDescription?: boolean;
  showFavorites?: boolean;
  showGroups?: boolean;
  groups?: Record<string, Record<string, string>>;
}

export interface PartyItemProp extends AccountMenuItemProps {
  uuid: string;
  isDeleted?: boolean;
  parentId?: string | undefined;
  parentName?: string | undefined;
  isFavorite?: boolean;
  isCurrentEndUser?: boolean;
  badge?: BadgeProps;
  isParent?: boolean;
}

interface UseAccountsProps {
  parties: PartyFieldsFragment[];
  selectedParties: PartyFieldsFragment[];
  allOrganizationsSelected: boolean;
  options?: UseAccountOptions;
  isLoading?: boolean;
  availableParties?: PartyFieldsFragment[];
}

interface UseAccountsOutput {
  accounts: PartyItemProp[];
  accountGroups: MenuItemGroups;
  accountSearch: AccountSearchProps | undefined;
  filterAccount?: (item: AccountMenuItemProps, search: string) => boolean;
  onSelectAccount: (account: string, route: PageRoutes) => void;
  selectedAccount?: Account;
  currentAccount?: Account;
}

export const formatSSN = (ssn: string, maskIdentifierSuffix: boolean) => {
  if (maskIdentifierSuffix) {
    return ssn.slice(0, 6) + '\u2009' + 'XXXXX';
  }
  return ssn.slice(0, 6) + '\u2009' + ssn.slice(6);
};

export const formatNorwegianId = (partyId: string, isCurrentEndUser: boolean) => {
  const parts = partyId.split('identifier-no:');
  if (parts.length < 2) return '';

  const ssnOrOrgNo = parts[1];
  const isPerson = partyId.includes('person');

  if (!ssnOrOrgNo) return '';

  if (isPerson) {
    return formatSSN(ssnOrOrgNo, !isCurrentEndUser);
  }

  return [ssnOrOrgNo.slice(0, 3), ssnOrOrgNo.slice(3, 6), ssnOrOrgNo.slice(6, 9)].join('\u2009');
};

export const useAccounts = ({
  parties,
  selectedParties,
  allOrganizationsSelected,
  options: inputOptions,
  isLoading,
  availableParties: availablePartiesInput,
}: UseAccountsProps): UseAccountsOutput => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setSelectedPartyIds } = useParties();
  const { favoritesGroup } = useProfile();
  const [searchString, setSearchString] = useState<string>('');
  const accountSearchThreshold = 2;
  const showSearch = parties.length > accountSearchThreshold;
  const availableParties = availablePartiesInput ?? parties;

  const filterAccount = (item: AccountMenuItemProps, search: string) => {
    if (search.length && item.groupId === SettingsType.favorites) {
      return false;
    }

    if (search) {
      const partyItem: PartyItemProp = item as PartyItemProp;
      const normalized = search.trim().toLowerCase();
      const parts = normalized.split(/\s+/);
      const title = (partyItem.name ?? '').toString().toLowerCase();
      const parentName = (partyItem.parentName ?? '').toString().toLowerCase();
      const description = (partyItem.description ?? '').toString().toLowerCase();
      return (
        parts.some((part) => title.includes(part) || parentName.includes(part) || description.includes(part)) ||
        title.includes(normalized) ||
        parentName.includes(normalized) ||
        description.includes(normalized)
      );
    }
    return false;
  };

  const loadingAccountMenuItem: AccountMenuItemProps = useMemo(
    () => ({
      id: 'loading-account',
      type: 'person' as AccountMenuItemProps['type'],
      groupId: 'loading',
      title: '',
      loading: true,
      icon: { name: '', type: 'person' },
      name: '',
    }),
    [],
  );

  const loadingAccount = useMemo(() => {
    const { groupId: _, ...account } = loadingAccountMenuItem;
    return account;
  }, [loadingAccountMenuItem]);

  // CRITICAL: Memoize party filtering to avoid re-filtering thousands of parties on every render
  // Must be called before any conditional returns to follow Rules of Hooks
  const { currentEndUser, otherPeople, organizations } = useMemo(() => {
    if (isLoading) {
      return { currentEndUser: undefined, otherPeople: [], organizations: [] };
    }

    let endUser: PartyFieldsFragment | undefined;
    const people: PartyFieldsFragment[] = [];
    const orgs: PartyFieldsFragment[] = [];

    for (let i = 0; i < parties.length; i++) {
      const party = parties[i];
      if (party.partyType === 'Person') {
        if (party.isCurrentEndUser) {
          endUser = party;
        } else {
          people.push(party);
        }
      } else if (party.partyType === 'Organization') {
        orgs.push(party);
      }
    }

    return {
      currentEndUser: endUser,
      otherPeople: people,
      organizations: orgs,
    };
  }, [parties, isLoading]);

  const defaultGroups = useMemo(
    () => ({
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
    }),
    [t],
  );

  const defaultOptions: UseAccountOptions = useMemo(
    () => ({
      showDescription: true,
      showFavorites: true,
      showGroups: false,
      groups: defaultGroups,
    }),
    [defaultGroups],
  );

  const options = useMemo(() => ({ ...defaultOptions, ...inputOptions }), [defaultOptions, inputOptions]);

  // CRITICAL: Memoize expensive mapping operations for people
  const otherPeopleAccounts: PartyItemProp[] = useMemo(() => {
    if (isLoading || !selectedParties?.length) return [];

    return otherPeople.map((person) => {
      const description = t('word.ssn') + formatNorwegianId(person.party, false);
      return {
        id: person.party,
        name: person.name,
        type: 'person' as AccountMenuItemProps['type'],
        icon: { name: person.name, type: 'person' as AvatarType },
        isDeleted: person.isDeleted,
        isFavorite: favoritesGroup?.parties?.includes(person.partyUuid),
        isCurrentEndUser: false,
        uuid: person.partyUuid,
        description: options.showDescription ? description : undefined,
        badge: person.isDeleted ? { color: 'danger', label: t('badge.deleted'), variant: 'base' } : undefined,
        groupId: 'persons',
      };
    });
  }, [otherPeople, options.showDescription, favoritesGroup?.parties, t, isLoading, selectedParties]);

  // CRITICAL: Memoize VERY expensive mapping for organizations (worst offender with thousands of parties)
  const organizationAccounts: PartyItemProp[] = useMemo(() => {
    if (isLoading || !selectedParties?.length) return [];

    return organizations.map((party) => {
      const isParent = Array.isArray(availableParties.find((p) => p.party === party.party)?.subParties);
      const parent = isParent
        ? undefined
        : availableParties.find((org) => org?.subParties?.find((subparty) => subparty.party === party.party));

      const description =
        parent?.name && party?.party
          ? `↳ ${t('word.orgNo')} ${formatNorwegianId(party.party, false)}, ${t('profile.account.partOf')} ${parent?.name}`
          : `${t('word.orgNo')} ${formatNorwegianId(party.party, false)}`;

      return {
        id: party.party,
        name: party.name,
        type: 'company' as AccountMenuItemProps['type'],
        icon: { name: party.name, type: 'company' as AvatarType, isParent, isDeleted: party.isDeleted },
        isDeleted: party.isDeleted,
        isFavorite: favoritesGroup?.parties?.includes(party.partyUuid),
        isCurrentEndUser: false,
        uuid: party.partyUuid,
        disabled: party.hasOnlyAccessToSubParties,
        isParent,
        parentId: parent?.party,
        parentName: parent?.name,
        description: options.showDescription ? description : undefined,
        badge: party.isDeleted ? { color: 'danger', label: t('badge.deleted'), variant: 'base' } : undefined,
        groupId: parent?.party ?? party.party,
      };
    });
  }, [
    organizations,
    availableParties,
    options.showDescription,
    favoritesGroup?.parties,
    t,
    isLoading,
    selectedParties,
  ]);

  // CRITICAL: Memoize allOrganizationsAccount (contains nested map operation)
  const allOrganizationsAccount: PartyItemProp = useMemo(
    () => ({
      uuid: 'N/A',
      id: 'ALL',
      name: t('parties.labels.all_organizations'),
      type: 'group',
      groupId: 'groups',
      icon: {
        type: 'group' as AccountMenuItemProps['type'],
        items: organizationAccounts.map((party) => ({
          id: party.id,
          name: party.name,
          type: 'company' as AccountMenuItemProps['type'],
          variant: party.isParent ? 'solid' : 'outline',
        })),
      } as AvatarGroupProps,
    }),
    [organizationAccounts, t],
  );

  // Memoize endUserAccount
  const endUserAccount: PartyItemProp | undefined = useMemo(() => {
    if (isLoading || !selectedParties?.length || !currentEndUser) return undefined;

    const description = currentEndUser.party ? t('word.ssn') + formatNorwegianId(currentEndUser.party, true) : '';
    return {
      id: currentEndUser.party ?? '',
      name: currentEndUser.name ?? '',
      type: 'person' as AccountMenuItemProps['type'],
      groupId: 'primary',
      icon: { name: currentEndUser.name ?? '', type: 'person' as AvatarType },
      isCurrentEndUser: true,
      uuid: currentEndUser.partyUuid ?? '',
      description: options.showDescription ? description : undefined,
      badge: { color: 'person', label: t('badge.you') },
    };
  }, [currentEndUser, options.showDescription, t, isLoading, selectedParties]);

  // CRITICAL: Memoize favorites filtering and mapping
  const favorites = useMemo(() => {
    return [...organizationAccounts, ...otherPeopleAccounts]
      .filter((a) => a.isFavorite)
      .map((a) => ({ ...a, groupId: 'favorites' }));
  }, [organizationAccounts, otherPeopleAccounts]);

  const accountGroups: MenuItemGroups = useMemo(
    () => ({
      ...options.groups,
      ...(organizations.length && options.groups?.companies
        ? {
            [organizations[0].party]: options.groups.companies,
          }
        : {}),
    }),
    [options.groups, organizations],
  );

  // CRITICAL: Memoize final accounts array assembly
  const accounts: PartyItemProp[] = useMemo(
    () => [
      ...(endUserAccount ? [endUserAccount] : []),
      ...(options.showFavorites ? favorites : []),
      ...(options.showGroups
        ? organizationAccounts.length > 1 && getPartyIds(organizations).length <= 20
          ? [allOrganizationsAccount]
          : []
        : []),
      ...otherPeopleAccounts,
      ...organizationAccounts,
    ],
    [
      endUserAccount,
      options.showFavorites,
      options.showGroups,
      favorites,
      organizationAccounts,
      organizations,
      allOrganizationsAccount,
      otherPeopleAccounts,
    ],
  );

  // Memoize selectedAccount to prevent object recreation
  const selectedAccount = useMemo(() => {
    const selectedAccountMenuItem = allOrganizationsSelected
      ? allOrganizationsAccount
      : accounts.find((account) => selectedParties[0]?.party === account.id);

    return (
      selectedAccountMenuItem
        ? {
            id: selectedAccountMenuItem.id,
            name: selectedAccountMenuItem.name,
            description:
              options.showDescription && selectedAccountMenuItem.description
                ? String(selectedAccountMenuItem.description)
                : undefined,
            type: selectedAccountMenuItem.type,
            icon: selectedAccountMenuItem.icon,
          }
        : loadingAccount
    ) as Account;
  }, [
    allOrganizationsSelected,
    allOrganizationsAccount,
    accounts,
    selectedParties,
    options.showDescription,
    loadingAccount,
  ]);

  // Memoize currentAccount
  const currentAccount: Account = useMemo(() => {
    return allOrganizationsSelected
      ? {
          id: endUserAccount?.id ?? 'not_found',
          name: endUserAccount?.name ?? '',
          description:
            options.showDescription && endUserAccount?.description ? String(endUserAccount?.description) : undefined,
          type: 'person',
          icon: {
            type: 'person',
            name: endUserAccount?.name ?? '',
          },
        }
      : selectedAccount || loadingAccount;
  }, [allOrganizationsSelected, endUserAccount, options.showDescription, selectedAccount, loadingAccount]);

  const accountSearch = showSearch
    ? {
        name: 'account-search',
        value: searchString,
        onChange: (event: ChangeEvent<HTMLInputElement>) => {
          setSearchString(event.target.value);
        },
        placeholder: t('parties.search'),
        getResultsLabel: (hits: number) => {
          if (hits === 0) {
            return t('parties.search.no_results');
          }
          return t('parties.results', { hits });
        },
      }
    : undefined;

  const onSelectAccount = (account: string, route: PageRoutes) => {
    const allAccountsSelected = account === 'ALL';
    const search = new URLSearchParams();

    if (location.pathname === route) {
      setSelectedPartyIds(allAccountsSelected ? [] : [account], allAccountsSelected);
    } else {
      search.append(
        allAccountsSelected ? 'allParties' : 'party',
        allAccountsSelected ? 'true' : encodeURIComponent(account),
      );
      navigate(route + `?${search.toString()}`);
    }
  };

  // Handle loading state
  if (isLoading) {
    return {
      accounts: [loadingAccountMenuItem as PartyItemProp],
      accountGroups: { loading: { title: t('profile.accounts.loading') } },
      selectedAccount: loadingAccount as Account,
      accountSearch: undefined,
      onSelectAccount: () => {},
      currentAccount: loadingAccount as Account,
    };
  }

  // Handle empty selected parties
  if (!selectedParties?.length) {
    return {
      accounts: [],
      accountGroups: {},
      accountSearch: undefined,
      onSelectAccount: () => {},
    };
  }

  return {
    accounts,
    accountGroups,
    selectedAccount,
    accountSearch,
    onSelectAccount,
    currentAccount,
    filterAccount,
  };
};
