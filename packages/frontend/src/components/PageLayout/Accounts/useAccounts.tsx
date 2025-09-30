import type {
  Account,
  AccountMenuItemProps,
  AccountSearchProps,
  AvatarGroupProps,
  AvatarType,
  MenuItemGroups,
} from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { type ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties.ts';
import { getPartyIds } from '../../../api/utils/dialog.ts';
import type { PageRoutes } from '../../../pages/routes.ts';

interface UseAccountsProps {
  parties: PartyFieldsFragment[];
  selectedParties: PartyFieldsFragment[];
  allOrganizationsSelected: boolean;
}

interface UseAccountsOutput {
  accounts: AccountMenuItemProps[];
  accountGroups: MenuItemGroups;
  accountSearch: AccountSearchProps | undefined;
  onSelectAccount: (account: string, route: PageRoutes) => void;
  selectedAccount?: Account;
}

export const useAccounts = ({
  parties,
  selectedParties,
  allOrganizationsSelected,
}: UseAccountsProps): UseAccountsOutput => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setSelectedPartyIds } = useParties();
  const [searchString, setSearchString] = useState<string>('');
  const accountSearchThreshold = 2;

  const showSearch = parties.length > accountSearchThreshold;

  const endUser = parties.find((party) => party.partyType === 'Person' && party.isCurrentEndUser);
  const nonEndUsers = parties.filter((party) => party.partyType === 'Person' && !party.isCurrentEndUser);
  const organizations = parties.filter((party) => party.partyType === 'Organization');

  if (!selectedParties?.length) {
    return {
      accounts: [],
      accountGroups: {},
      accountSearch: undefined,
      onSelectAccount: () => {},
    };
  }

  const accountGroups: MenuItemGroups = {
    ...(endUser && {
      primary: {
        title: t('parties.groups.self'),
      },
    }),
    ...(organizations.length && {
      secondary: {
        title: t('parties.groups.other_accounts'),
      },
    }),
  };

  const endUserAccount: AccountMenuItemProps = {
    id: endUser?.party ?? '',
    name: endUser?.name ?? '',
    type: 'person' as AccountMenuItemProps['type'],
    groupId: 'primary',
    icon: { name: endUser?.name ?? '', type: 'person' as AvatarType },
  };

  const otherUsersAccounts = nonEndUsers.map((noEnderUserParty) => {
    return {
      id: noEnderUserParty.party,
      name: noEnderUserParty.name,
      type: 'person' as AccountMenuItemProps['type'],
      groupId: 'other_users',
      icon: { name: noEnderUserParty.name, type: 'person' as AvatarType },
    };
  });

  const organizationAccounts: AccountMenuItemProps[] = organizations.map((party) => {
    return {
      id: party.party,
      name: party.name,
      type: 'company' as AccountMenuItemProps['type'],
      groupId: 'secondary',
      icon: { name: party.name, type: 'company' as AvatarType },
    };
  });

  const allOrganizationsAccount: AccountMenuItemProps = {
    id: 'ALL',
    name: t('parties.labels.all_organizations'),
    type: 'group',
    groupId: 'secondary',
    icon: {
      type: 'company' as AccountMenuItemProps['type'],
      items: organizations.map((party) => ({
        id: party.party,
        name: party.name,
        type: 'company' as AccountMenuItemProps['type'],
      })),
    } as AvatarGroupProps,
  };

  const accounts: AccountMenuItemProps[] = [
    ...(endUser ? [endUserAccount] : []),
    ...otherUsersAccounts,
    ...(organizationAccounts.length > 1 && getPartyIds(organizations).length <= 20
      ? [...organizationAccounts, allOrganizationsAccount]
      : organizationAccounts),
  ];

  const selectedAccountMenuItem: AccountMenuItemProps = allOrganizationsSelected
    ? allOrganizationsAccount
    : selectedParties.map((party) => ({
        id: party.party,
        name: party.name,
        type: (party.partyType === 'Organization' ? 'company' : 'person') as AccountMenuItemProps['type'],
      }))[0];

  const selectedAccount: Account = {
    id: selectedAccountMenuItem.id,
    name: selectedAccountMenuItem.name,
    type: selectedAccountMenuItem.type as 'company' | 'person',
    icon: {
      type: selectedAccountMenuItem.type as AvatarType,
      name: selectedAccountMenuItem.name,
    },
  };

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

  return {
    accounts,
    accountGroups,
    selectedAccount,
    accountSearch,
    onSelectAccount,
  };
};
