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
import { useParties } from '../../../api/useParties.ts';
import { PageRoutes } from '../../../pages/routes.ts';
import type { InboxItemInput } from '../../InboxItem';
import { getAlertBadgeProps } from '../GlobalMenu';

interface UseAccountsProps {
  parties: PartyFieldsFragment[];
  selectedParties: PartyFieldsFragment[];
  dialogs: InboxItemInput[];
  allOrganizationsSelected: boolean;
  dialogCountInconclusive: boolean;
}

interface UseAccountsOutput {
  accounts: AccountMenuItem[];
  accountGroups: MenuItemGroups;
  selectedAccount: Account;
  accountSearch: AccountSearchProps | undefined;
  onSelectAccount: (account: string) => void;
}

type AccountType = 'company' | 'person';

const getAllPartyIds = (party: PartyFieldsFragment | PartyFieldsFragment[]): string[] => {
  const subPartyIds = Array.isArray(party) ? party.flatMap((p) => getSubPartyIds(p)) : getSubPartyIds(party);
  const partyIds = Array.isArray(party) ? party.map((p) => p.party) : [party.party];
  return [...partyIds, ...subPartyIds];
};

export const getAccountAlertBadge = (
  dialogs: InboxItemInput[],
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
  dialogs: InboxItemInput[],
  party?: PartyFieldsFragment | PartyFieldsFragment[],
  dialogCountInconclusive?: boolean,
): BadgeProps | undefined => {
  if (dialogCountInconclusive) {
    return {
      size: 'xs',
      label: '',
    };
  }

  if (!party || !dialogs?.length || (Array.isArray(party) && !party.length)) {
    return undefined;
  }

  const allPartyIds = getAllPartyIds(party);
  const count = dialogs.filter((dialog) => allPartyIds.includes(dialog.party)).length;

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
  dialogs,
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
      selectedAccount: {
        id: 'no-account',
        name: '?',
        type: 'person',
      },
      accountSearch: undefined,
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
    badge: getAccountBadge(dialogs, endUser, dialogCountInconclusive),
    alertBadge: getAccountAlertBadge(dialogs, endUser),
  };

  const otherUsersAccounts = nonEndUsers.map((noEnderUserParty) => {
    return {
      id: noEnderUserParty.party,
      name: noEnderUserParty.name,
      type: 'person' as AccountType,
      groupId: 'other_users',
      badge: getAccountBadge(dialogs, noEnderUserParty, dialogCountInconclusive),
      alertBadge: getAccountAlertBadge(dialogs, noEnderUserParty),
    };
  });

  const organizationAccounts: AccountMenuItem[] = organizations.map((party) => {
    return {
      id: party.party,
      name: party.name,
      type: 'company' as AccountType,
      groupId: 'secondary',
      badge: getAccountBadge(dialogs, party, dialogCountInconclusive),
      alertBadge: getAccountAlertBadge(dialogs, party),
    };
  });

  const allOrganizationsAccount: AccountMenuItem = {
    id: 'ALL',
    name: t('parties.labels.all_organizations'),
    type: 'company' as AccountType,
    groupId: 'secondary',
    accountNames: organizations.map((party) => party.name),
    badge: getAccountBadge(dialogs, organizations, dialogCountInconclusive),
    alertBadge: getAccountAlertBadge(dialogs, organizations),
  };

  const accounts: AccountMenuItem[] = [
    ...(endUser ? [endUserAccount] : []),
    ...otherUsersAccounts,
    ...(organizationAccounts.length > 1 ? [...organizationAccounts, allOrganizationsAccount] : organizationAccounts),
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

  const onSelectAccount = (account: string) => {
    const allAccountsSelected = account === 'ALL';
    const search = new URLSearchParams();

    if (location.pathname === PageRoutes.inbox) {
      setSelectedPartyIds(allAccountsSelected ? [] : [account], allAccountsSelected);
    } else {
      search.append(
        allAccountsSelected ? 'allParties' : 'party',
        allAccountsSelected ? 'true' : encodeURIComponent(account),
      );
      navigate(PageRoutes.inbox + `?${search.toString()}`);
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
