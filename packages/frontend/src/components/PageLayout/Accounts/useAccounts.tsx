import type {
  Account,
  AccountMenuItem,
  AccountSearchProps,
  BadgeProps,
  MenuItemGroups,
} from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { type ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { flattenParties } from '../../../api/useDialogs.tsx';
import { useParties } from '../../../api/useParties.ts';
import type { PageRoutes } from '../../../pages/routes.ts';
import { getAlertBadgeProps } from '../GlobalMenu';

export interface CountableItem {
  party: string;
  isSeenByEndUser?: boolean;
}

interface UseAccountsProps {
  parties: PartyFieldsFragment[];
  selectedParties: PartyFieldsFragment[];
  countableItems: CountableItem[];
  allOrganizationsSelected: boolean;
  dialogCountInconclusive: boolean;
}

interface UseAccountsOutput {
  accounts: AccountMenuItem[];
  accountGroups: MenuItemGroups;
  accountSearch: AccountSearchProps | undefined;
  onSelectAccount: (account: string, route: PageRoutes) => void;
  selectedAccount?: Account;
}

type AccountType = 'company' | 'person';

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
  party?: PartyFieldsFragment | PartyFieldsFragment[],
  dialogCountInconclusive?: boolean,
): BadgeProps | undefined => {
  if (dialogCountInconclusive) {
    return {
      size: 'xs',
      label: '',
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
    };
  }
};

const getSubPartyIds = (party?: PartyFieldsFragment): string[] => {
  return party?.subParties?.filter((subParty) => subParty.name === party.name).map((party) => party.party) ?? [];
};

export const useAccounts = ({
  parties,
  selectedParties,
  countableItems,
  allOrganizationsSelected,
  dialogCountInconclusive,
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

  const endUserAccount = {
    id: endUser?.party ?? '',
    name: endUser?.name ?? '',
    type: 'person' as AccountType,
    groupId: 'primary',
    badge: getAccountBadge(countableItems, endUser, dialogCountInconclusive),
    alertBadge: getAccountAlertBadge(countableItems, endUser),
  };

  const otherUsersAccounts = nonEndUsers.map((noEnderUserParty) => {
    return {
      id: noEnderUserParty.party,
      name: noEnderUserParty.name,
      type: 'person' as AccountType,
      groupId: 'other_users',
      badge: getAccountBadge(countableItems, noEnderUserParty, dialogCountInconclusive),
      alertBadge: getAccountAlertBadge(countableItems, noEnderUserParty),
    };
  });

  const organizationAccounts: AccountMenuItem[] = organizations.map((party) => {
    return {
      id: party.party,
      name: party.name,
      type: 'company' as AccountType,
      groupId: 'secondary',
      badge: getAccountBadge(countableItems, party, dialogCountInconclusive),
      alertBadge: getAccountAlertBadge(countableItems, party),
    };
  });

  const allOrganizationsAccount: AccountMenuItem = {
    id: 'ALL',
    name: t('parties.labels.all_organizations'),
    type: 'company' as AccountType,
    groupId: 'secondary',
    accountNames: organizations.map((party) => party.name),
    badge: getAccountBadge(countableItems, organizations, dialogCountInconclusive),
    alertBadge: getAccountAlertBadge(countableItems, organizations),
  };

  const accounts: AccountMenuItem[] = [
    ...(endUser ? [endUserAccount] : []),
    ...otherUsersAccounts,
    ...(organizationAccounts.length > 1 && flattenParties(organizations).length <= 20
      ? [...organizationAccounts, allOrganizationsAccount]
      : organizationAccounts),
  ];

  const selectedAccount = allOrganizationsSelected
    ? allOrganizationsAccount
    : selectedParties.map((party) => ({
        id: party.party,
        name: party.name,
        type: party.partyType.toLowerCase() as AccountType,
      }))[0];

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
