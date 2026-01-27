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
import i18n from 'i18next';
import { type ChangeEvent, type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import { useFeatureFlag } from '../../../featureFlags/useFeatureFlag';
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
    const ssnOrOrgNo = getSSNOrOrgNo(partyItem.id);
    return parts.some(
      (part) =>
        title.includes(part) ||
        parentName.includes(part) ||
        title.includes(normalized) ||
        parentName.includes(normalized) ||
        ssnOrOrgNo.includes(normalized),
    );
  }
  return false;
};

const compareName = (a: string, b: string) =>
  a.localeCompare(b, i18n.language, {
    sensitivity: 'base',
    ignorePunctuation: true,
  });

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
  const { favoritesGroup, shouldShowDeletedEntities } = useProfile();
  const isDeletedUnitsFilterEnabled = useFeatureFlag<boolean>('inbox.enableDeletedUnitsFilter');
  const [searchString, setSearchString] = useState<string>('');
  const accountSearchThreshold = 2;
  const showSearch = parties.length > accountSearchThreshold;
  const availableParties = availablePartiesInput ?? parties;

  const loadingAccountMenuItem: AccountMenuItemProps = {
    id: 'loading-account',
    type: 'person' as AccountMenuItemProps['type'],
    groupId: 'loading',
    title: '',
    loading: true,
    icon: { name: '', type: 'person' },
    name: '',
  };

  const { groupId: _, ...loadingAccount } = loadingAccountMenuItem;

  const currentEndUser = useMemo(() => {
    return parties.find(
      (party) => (party.partyType === 'Person' || party.partyType === 'SelfIdentified') && party.isCurrentEndUser,
    );
  }, [parties]);

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

  const otherPeopleAccounts = useMemo<PartyItemProp[]>(() => {
    return otherPeople
      .map((person) => {
        const description = t('word.ssn') + formatNorwegianId(person.party, false);
        return {
          id: person.party,
          ssnOrOrgNo: getSSNOrOrgNo(person.party),
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
        } as PartyItemProp;
      })
      .sort((a, b) => compareName(a.name, b.name));
  }, [otherPeople, favoritesGroup, options.showDescription, t]);

  const organizationAccounts = useMemo<PartyItemProp[]>(() => {
    const mapped = organizations.map((party) => {
      const isParent = Array.isArray(availableParties.find((p) => p.party === party.party)?.subParties);

      const parent = isParent
        ? undefined
        : availableParties.find((org) => org?.subParties?.some((sub) => sub.party === party.party));

      const description =
        parent?.name && party?.party
          ? `↳ ${t('word.orgNo')} ${formatNorwegianId(
              party.party,
              false,
            )}, ${t('profile.account.partOf')} ${parent.name}`
          : `${t('word.orgNo')} ${formatNorwegianId(party.party, false)}`;

      return {
        id: party.party,
        ssnOrOrgNo: getSSNOrOrgNo(party.party),
        name: party.name,
        type: 'company' as AccountMenuItemProps['type'],
        icon: {
          name: party.name,
          type: 'company' as AvatarType,
          isParent,
          isDeleted: party.isDeleted,
        },
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
  }, [organizations, availableParties, favoritesGroup, options.showDescription, t]);

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

  if (!selectedParties?.length) {
    return {
      accounts: [],
      accountGroups: {},
      accountSearch: undefined,
      onSelectAccount: () => {},
    };
  }

  const accountGroups = {
    ...options.groups,
    ...(organizationAccounts.length && options.groups?.companies
      ? {
          [organizationAccounts?.[0].id]: options.groups?.companies,
        }
      : {}),
  } as MenuItemGroups;

  const norwegianId = currentEndUser?.party ? formatNorwegianId(currentEndUser.party, true) : '';
  const description = currentEndUser?.party && norwegianId ? t('word.ssn') + norwegianId : '';

  const endUserAccount: PartyItemProp | undefined = currentEndUser
    ? {
        id: currentEndUser.party ?? '',
        name: currentEndUser.name ?? '',
        type: 'person' as AccountMenuItemProps['type'],
        groupId: 'primary',
        icon: {
          name: currentEndUser.name ?? '',
          type: 'person' as AvatarType,
        },
        isCurrentEndUser: true,
        uuid: currentEndUser.partyUuid ?? '',
        description: options.showDescription ? description : undefined,
        badge: { color: 'person', label: t('badge.you') },
      }
    : undefined;

  const allOrganizationsAccount: PartyItemProp = {
    uuid: 'N/A',
    id: 'ALL',
    name: t('parties.labels.all_organizations'),
    type: 'group',
    groupId: 'groups',
    icon: {
      type: 'group' as AccountMenuItemProps['type'],
      maxItemsCountReachedLabel: organizationAccounts.length > 99 ? '..' : '',
      items: organizationAccounts.map((party) => ({
        id: party.id,
        name: party.name,
        type: 'company' as AccountMenuItemProps['type'],
        variant: party.isParent ? 'solid' : 'outline',
      })),
    } as AvatarGroupProps,
  };

  const favorites = [...organizationAccounts, ...otherPeopleAccounts]
    .filter((a) => a.isFavorite)
    .map((a) => ({ ...a, groupId: SettingsType.favorites }));

  const accounts: PartyItemProp[] = [
    ...(endUserAccount ? [endUserAccount] : []),
    ...(options.showFavorites ? favorites : []),
    ...(options.showGroups ? (organizationAccounts.length > 1 ? [allOrganizationsAccount] : []) : []),
    ...otherPeopleAccounts,
    ...organizationAccounts,
  ];

  const selectedAccountMenuItem = allOrganizationsSelected
    ? allOrganizationsAccount
    : accounts.find((account) => selectedParties[0]?.party === account.id);

  const selectedAccount = (
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

  const currentAccount: Account = allOrganizationsSelected
    ? {
        id: endUserAccount?.id ?? 'not_found',
        name: endUserAccount?.name ?? '',
        description:
          options.showDescription && endUserAccount?.description ? String(endUserAccount.description) : undefined,
        type: 'person',
        icon: {
          type: 'person',
          name: endUserAccount?.name ?? '',
        },
      }
    : selectedAccount || loadingAccount;

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

  /** deleted units filtering - FF: "inbox.enableDeletedUnitsFilter"
   * FF off -> always include deleted parties
   * FF on, switch off -> exclude deleted parties
   * FF on, switch on -> include deleted parties
   */
  const shouldExcludeDeleted = options.excludeDeleted ?? true;
  const includeDeletedParties = isDeletedUnitsFilterEnabled ? (shouldShowDeletedEntities ?? false) : true;

  let filteredAccounts = accounts;
  if (shouldExcludeDeleted && !includeDeletedParties) {
    filteredAccounts = accounts.filter((item) => {
      if (item.groupId === SettingsType.favorites || item.groupId === 'primary') {
        return true;
      }
      return !item.isDeleted;
    });
  }

  return {
    accounts: filteredAccounts,
    accountGroups,
    selectedAccount,
    accountSearch,
    onSelectAccount,
    currentAccount,
    filterAccount,
  };
};
