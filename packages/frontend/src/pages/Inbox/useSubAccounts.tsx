import type { MenuItemGroups, MenuItemProps } from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { PartyItemProp } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useGlobalState } from '../../useGlobalState.ts';
import { getSelectedSubAccountsFromQueryParams } from './queryParams.ts';

interface UseSubAccountsProps {
  accounts: PartyItemProp[];
  selectedParties: PartyFieldsFragment[];
  allOrganizationsSelected: boolean;
}

interface UseSubAccountsOutput {
  subAccounts: MenuItemProps[];
  subAccountGroups: MenuItemGroups;
  searchable: boolean;
  getSubAccountLabel: () => string;
  partyIdsOverride: string[];
}

const ALL_SUB_ACCOUNTS_ID = 'ALL_SUB_ACCOUNTS';

const getUniqueParties = (parties: PartyItemProp[]): PartyItemProp[] => {
  const uniquePartyIds = new Set<string>();
  const uniqueParties = new Set<PartyItemProp>();
  for (const party of parties) {
    if (uniquePartyIds.has(party.id)) continue;
    uniqueParties.add(party);
    uniquePartyIds.add(party.id);
  }
  return Array.from(uniqueParties);
};

export const useSubAccounts = ({
  accounts,
  selectedParties,
  allOrganizationsSelected,
}: UseSubAccountsProps): UseSubAccountsOutput => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedSubAccountIds, setSelectedSubAccountIds] = useGlobalState<string[]>(
    QUERY_KEYS.SELECTED_SUB_ACCOUNTS,
    getSelectedSubAccountsFromQueryParams(searchParams),
  );

  const selectedPartyId = selectedParties[0]?.party;
  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedPartyId),
    [accounts, selectedPartyId],
  );
  const parentAccount = useMemo(() => {
    return !allOrganizationsSelected && selectedAccount?.isParent ? selectedAccount : undefined;
  }, [allOrganizationsSelected, selectedAccount]);

  const subAccountsAndAll = useMemo<PartyItemProp[]>(() => {
    if (allOrganizationsSelected) {
      return getUniqueParties(
        accounts.filter((party: PartyItemProp) => party.type === 'company' || party.type === 'subunit'),
      );
    }

    if (parentAccount) {
      const subUnits = accounts.filter((a) => a.parentId === parentAccount.id);
      if (subUnits.length) {
        return getUniqueParties([parentAccount, ...subUnits]);
      }
      return [];
    }

    return [];
  }, [allOrganizationsSelected, accounts, parentAccount]);

  const filteredSubAccounts = useMemo(() => {
    return subAccountsAndAll.filter((item) => !item.disabled);
  }, [subAccountsAndAll]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentional to avoid trigger on updates
  useEffect(() => {
    if (!selectedSubAccountIds.length) return;
    if (accounts.length === 0) return;
    if (!filteredSubAccounts.length) {
      setSelectedSubAccountIds([]);
      return;
    }
    const filteredIds = selectedSubAccountIds.filter((id) => filteredSubAccounts.some((item) => item.id === id));
    if (filteredIds.length !== selectedSubAccountIds.length) {
      setSelectedSubAccountIds(filteredIds);
    }
  }, [accounts.length, filteredSubAccounts, selectedSubAccountIds]);

  const allLabel = allOrganizationsSelected ? t('parties.labels.all_organizations') : t('parties.labels.all_units');
  const mainUnitLabel = t('parties.labels.main_unit');
  const subUnitLabel = t('parties.labels.sub_unit');

  const getSubAccountTitle = useCallback(
    (item: PartyItemProp) => {
      if (parentAccount) {
        if (item.id === parentAccount.id) return mainUnitLabel;
        if (item.parentId === parentAccount.id && item.name === parentAccount.name) {
          return subUnitLabel;
        }
      }

      return item.name;
    },
    [mainUnitLabel, parentAccount, subUnitLabel],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const subAccounts = useMemo<MenuItemProps[]>(() => {
    if (!filteredSubAccounts.length) return [];

    const items = [...filteredSubAccounts].map((item) => {
      return {
        id: `subaccount-${item.id}`,
        groupId: item.parentId || item.id,
        title: getSubAccountTitle(item),
        description: item.description,
        role: 'checkbox',
        onChange: () => {
          onSelectSubAccount(item.id);
        },
        name: 'subaccount',
        value: item.id,
        checked: selectedSubAccountIds.includes(item.id),
        disabled: item.disabled,
        searchWords: item.searchWords,
      } satisfies MenuItemProps;
    });

    return [
      {
        id: ALL_SUB_ACCOUNTS_ID,
        title: allLabel,
        groupId: 'all',
        role: 'radio',
        name: 'subaccount',
        value: 'all',
        onChange: () => {
          setSelectedSubAccountIds([]);
        },
        checked: selectedSubAccountIds.length === 0,
      },
      ...items,
    ];
  }, [allLabel, filteredSubAccounts, getSubAccountTitle, selectedSubAccountIds]);

  const getSubAccountLabel = useCallback(() => {
    if (selectedSubAccountIds.length === 1) {
      const selectedSubAccount = filteredSubAccounts.find((item) => item.id === selectedSubAccountIds[0]);
      return selectedSubAccount ? getSubAccountTitle(selectedSubAccount) : allLabel;
    }
    if (allOrganizationsSelected) {
      if (selectedSubAccountIds.length === 0) {
        return t('parties.labels.units_count', { count: filteredSubAccounts.length });
      }
      return t('parties.labels.units_count', { count: selectedSubAccountIds.length });
    }
    if (selectedSubAccountIds.length === 0 || selectedSubAccountIds.length === filteredSubAccounts.length) {
      return allLabel;
    }
    if (selectedSubAccountIds.length > 1) {
      return t('parties.labels.units_count', { count: selectedSubAccountIds.length });
    }
    return t('parties.labels.units_count', { count: filteredSubAccounts.length });
  }, [
    allLabel,
    filteredSubAccounts,
    selectedSubAccountIds,
    t,
    accounts?.length,
    allOrganizationsSelected,
    getSubAccountTitle,
  ]);

  const onSelectSubAccount = (id: string) => {
    if (!id || id === ALL_SUB_ACCOUNTS_ID) {
      setSelectedSubAccountIds([]);
      return;
    }

    if (selectedSubAccountIds.includes(id)) {
      setSelectedSubAccountIds(selectedSubAccountIds.filter((item: string) => item !== id));
    } else {
      setSelectedSubAccountIds([...selectedSubAccountIds, id]);
    }
  };

  const groups = {
    all: {
      title: allOrganizationsSelected
        ? t('parties.labels.units_count', { count: accounts.length })
        : parentAccount?.name,
    },
  };

  return {
    subAccounts,
    getSubAccountLabel,
    partyIdsOverride: selectedSubAccountIds,
    searchable: subAccounts.length > 2,
    subAccountGroups: groups,
  };
};
