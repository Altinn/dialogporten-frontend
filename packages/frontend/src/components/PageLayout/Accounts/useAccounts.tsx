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
import { type ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { type SelectedPartyType, useParties } from '../../../api/hooks/useParties.ts';
import { getPartyIds } from '../../../api/utils/dialog.ts';
import type { PageRoutes } from '../../../pages/routes.ts';
import { getAlertBadgeProps } from '../GlobalMenu';

export interface CountableItem {
  party: string;
  isSeenByEndUser?: boolean;
}

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
const getAllPartyIds = (party: PartyFieldsFragment | PartyFieldsFragment[]): string[] => {
  const subPartyIds = Array.isArray(party) ? party.flatMap((p) => getSubPartyIds(p)) : getSubPartyIds(party);
  const partyIds = Array.isArray(party) ? party.map((p) => p.party) : [party.party];
  return [...partyIds, ...subPartyIds];
};

export const getAccountAlertBadge = (
  dialogs: CountableItem[],
  party?: PartyFieldsFragment | PartyFieldsFragment[],
): BadgeProps | undefined => {
  if (!party || !dialogs?.length || (Array.isArray(party) && !party.length)) {
    return undefined;
  }

  const allPartyIds = getAllPartyIds(party);
  const count = dialogs
    .filter((dialog) => allPartyIds.includes(dialog.party))
    .filter((dialog) => !dialog.isSeenByEndUser).length;

  return getAlertBadgeProps(count);
};

export const getAccountBadge = (
  items: CountableItem[],
  party: PartyFieldsFragment | PartyFieldsFragment[] | undefined,
  dialogCountInconclusive: boolean,
  selectedProfile?: SelectedPartyType,
): BadgeProps | undefined => {
  if (dialogCountInconclusive) {
    return {
      size: 'xs',
      label: '',
      color: selectedProfile,
    };
  }

  if (!party || !items?.length || (Array.isArray(party) && !party.length)) {
    return undefined;
  }

  const allPartyIds = getAllPartyIds(party);
  const count = items.filter((dialog) => allPartyIds.includes(dialog.party)).length;

  if (count > 0) {
    return {
      label: count.toString(),
      size: 'sm',
      color: selectedProfile,
    };
  }
};

const getSubPartyIds = (party?: PartyFieldsFragment): string[] => {
  return party?.subParties?.filter((subParty) => subParty.name === party.name).map((party) => party.party) ?? [];
};

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
        title: t('parties.groups.yourself'),
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
        type: party.partyType.toLowerCase() as Account['type'],
      }))[0];
  const selectedAccount: Account = {
    id: selectedAccountMenuItem.id,
    name: selectedAccountMenuItem.name,
    type: selectedAccountMenuItem.type as 'company' | 'person',
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
