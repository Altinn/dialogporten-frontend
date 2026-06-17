import type { MenuItemGroups, MenuItemProps } from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { MAX_DIALOG_PARTY_SIZE } from '../../api/hooks/useDialogs.tsx';
import type { PartyItemProp } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import {
  FixedGlobalQueryParams,
  type PartyGroup,
  PartyGroups,
  encodeSubAccountIds,
  getSelectedSubAccountsFromQueryParams,
} from './queryParams.ts';

interface UseSubAccountsProps {
  accounts: PartyItemProp[];
  selectedParties: PartyFieldsFragment[];
  selectedGroup: PartyGroup | null;
  selectedServicesCount: number;
}

interface UseSubAccountsOutput {
  subAccounts: MenuItemProps[];
  onSelectSubAccount: (id: string) => void;
  subAccountGroups: MenuItemGroups;
  searchable: boolean;
  getSubAccountLabel: () => string;
  partyIdsOverride: string[];
  showPageLabel: boolean;
  accountNavigatorHidden: boolean;
}

const ALL_SUB_ACCOUNTS_ID = 'ALL_SUB_ACCOUNTS';

const getUniqueParties = (parties: PartyItemProp[]): PartyItemProp[] => {
  const seen = new Set<string>();
  const result: PartyItemProp[] = [];
  for (const party of parties) {
    if (seen.has(party.id)) continue;
    seen.add(party.id);
    result.push(party);
  }
  return result;
};

export const useSubAccounts = ({
  accounts,
  selectedParties,
  selectedGroup,
  selectedServicesCount,
}: UseSubAccountsProps): UseSubAccountsOutput => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const allOrganizationsSelected = selectedGroup === PartyGroups.ALL_COMPANIES;
  const allPersonsSelected = selectedGroup === PartyGroups.ALL_PERSONS;
  const isGroupSelected = selectedGroup !== null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const selectedSubAccountIds = useMemo(() => {
    return getSelectedSubAccountsFromQueryParams(searchParams);
  }, [searchParams.get(FixedGlobalQueryParams.subAccounts)]);

  /** Set for O(1) lookups — avoids O(n×m) in .map() and .includes() checks */
  const selectedSubAccountIdSet = useMemo(() => new Set(selectedSubAccountIds), [selectedSubAccountIds]);

  const updateSelectedSubAccountIds = useCallback(
    (ids: string[]) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      const encoded = encodeSubAccountIds(ids);
      if (encoded) {
        nextParams.set(FixedGlobalQueryParams.subAccounts, encoded);
      } else {
        nextParams.delete(FixedGlobalQueryParams.subAccounts);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  /** Pre-index accounts by id and parentId for O(1) lookups instead of O(n) .find()/.filter() */
  const accountIndex = useMemo(() => {
    const byId = new Map<string, PartyItemProp>();
    const byParentId = new Map<string, PartyItemProp[]>();
    const companies: PartyItemProp[] = [];
    const persons: PartyItemProp[] = [];

    for (const account of accounts) {
      byId.set(account.id, account);
      if (account.type === 'company' || account.type === 'subunit') {
        companies.push(account);
      } else if (account.type === 'person') {
        persons.push(account);
      }
      if (account.parentId) {
        let children = byParentId.get(account.parentId);
        if (!children) {
          children = [];
          byParentId.set(account.parentId, children);
        }
        children.push(account);
      }
    }

    return { byId, byParentId, companies, persons };
  }, [accounts]);

  const selectedPartyId = selectedParties[0]?.party;
  const selectedAccount = useMemo(() => accountIndex.byId.get(selectedPartyId ?? ''), [accountIndex, selectedPartyId]);
  const parentAccount = useMemo(() => {
    return !isGroupSelected && selectedAccount?.isParent ? selectedAccount : undefined;
  }, [isGroupSelected, selectedAccount]);

  const subAccountsAndAll = useMemo<PartyItemProp[]>(() => {
    if (allOrganizationsSelected) {
      return getUniqueParties(accountIndex.companies);
    }

    if (allPersonsSelected) {
      return getUniqueParties(accountIndex.persons);
    }

    if (parentAccount) {
      const subUnits = accountIndex.byParentId.get(parentAccount.id) ?? [];
      if (subUnits.length) {
        return getUniqueParties([parentAccount, ...subUnits]);
      }
      return [];
    }

    return [];
  }, [allOrganizationsSelected, allPersonsSelected, accountIndex, parentAccount]);

  const filteredSubAccounts = useMemo(() => {
    return subAccountsAndAll.filter((item) => !item.disabled);
  }, [subAccountsAndAll]);

  /*
   * Only suppress the navigator for a service filter when the query bypasses the party list
   * entirely — i.e. the "Alle virksomheter" path with no sub-account override, where it sends an
   * empty party list (all parties) and runs without paginating. As soon as parties are sent (a
   * single selected parent, or an override), a service filter can push the count over
   * MAX_DIALOG_PARTY_SIZE and disable the query, so the navigator must stay available as the way out.
   */
  const hasSubAccountOverride = selectedSubAccountIds.length > 0;
  const accountNavigatorHidden =
    filteredSubAccounts.length < MAX_DIALOG_PARTY_SIZE ||
    (allOrganizationsSelected && selectedServicesCount > 0 && !hasSubAccountOverride);
  const showPageLabel = !accountNavigatorHidden;

  // Labels differ by selection: an "all companies"/"all persons" group counts members ("3 units" /
  // "3 persons"), while drilling into a single parent shows its sub-units.
  const groupCountLabel = useCallback(
    (count: number) =>
      allPersonsSelected ? t('parties.labels.persons_count', { count }) : t('parties.labels.units_count', { count }),
    [allPersonsSelected, t],
  );
  const groupPartialCountLabel = useCallback(
    (selected: number, total: number) =>
      allPersonsSelected
        ? t('parties.labels.persons_partial_count', { selected, total })
        : t('parties.labels.units_partial_count', { selected, total }),
    [allPersonsSelected, t],
  );

  const allLabel = isGroupSelected
    ? allPersonsSelected
      ? t('parties.labels.all_persons')
      : t('parties.labels.all_organizations')
    : t('parties.labels.all_units');
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

  /**
   * Use a ref for the select handler so the subAccounts memo doesn't depend on selectedSubAccountIds.
   * This avoids rebuilding the entire menu items array on every sub-account toggle.
   */
  const selectedSubAccountIdsRef = useRef(selectedSubAccountIds);
  selectedSubAccountIdsRef.current = selectedSubAccountIds;
  const updateRef = useRef(updateSelectedSubAccountIds);
  updateRef.current = updateSelectedSubAccountIds;

  const onSelectSubAccount = useCallback((id: string) => {
    if (!id || id === ALL_SUB_ACCOUNTS_ID) {
      updateRef.current([]);
      return;
    }

    const current = selectedSubAccountIdsRef.current;
    if (current.includes(id)) {
      updateRef.current(current.filter((item: string) => item !== id));
    } else {
      updateRef.current([...current, id]);
    }
  }, []);

  const subAccounts = useMemo<MenuItemProps[]>(() => {
    if (!filteredSubAccounts.length) return [];
    const items = filteredSubAccounts.map((item) => {
      return {
        id: item.id,
        groupId: item.parentId || item.id,
        title: getSubAccountTitle(item),
        description: item.description,
        role: 'checkbox',
        name: 'subaccount',
        value: item.id,
        checked: selectedSubAccountIdSet.has(item.id),
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
        checked: selectedSubAccountIdSet.size === 0,
      },
      ...items,
    ];
  }, [allLabel, filteredSubAccounts, getSubAccountTitle, selectedSubAccountIdSet]);

  /** Pre-index filteredSubAccounts by id for O(1) label lookup */
  const filteredSubAccountsById = useMemo(() => {
    const map = new Map<string, PartyItemProp>();
    for (const item of filteredSubAccounts) {
      map.set(item.id, item);
    }
    return map;
  }, [filteredSubAccounts]);

  const currentPageIndex = useMemo(() => {
    if (selectedSubAccountIds.length === 0) return -1;
    const selected = new Set(selectedSubAccountIds);
    if (selected.size !== selectedSubAccountIds.length) return -1;
    for (let pageIndex = 0, i = 0; i < filteredSubAccounts.length; i += 100, pageIndex++) {
      const slice = filteredSubAccounts.slice(i, i + 100);
      if (slice.length !== selected.size) continue;
      if (slice.every((item) => selected.has(item.id))) return pageIndex;
    }
    return -1;
  }, [filteredSubAccounts, selectedSubAccountIds]);

  const getSubAccountLabel = useCallback(() => {
    if (showPageLabel && currentPageIndex >= 0) {
      return t('parties.labels.page', { number: currentPageIndex + 1 });
    }
    if (selectedSubAccountIds.length === 1) {
      const selectedSubAccount = filteredSubAccountsById.get(selectedSubAccountIds[0]);
      return selectedSubAccount ? getSubAccountTitle(selectedSubAccount) : allLabel;
    }
    if (isGroupSelected) {
      if (selectedSubAccountIds.length === 0) {
        return groupCountLabel(filteredSubAccounts.length);
      }
      return groupCountLabel(selectedSubAccountIds.length);
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
    currentPageIndex,
    filteredSubAccounts,
    filteredSubAccountsById,
    selectedSubAccountIds,
    t,
    isGroupSelected,
    groupCountLabel,
    getSubAccountTitle,
    showPageLabel,
  ]);

  const groups = {
    all: {
      title: isGroupSelected
        ? selectedSubAccountIds.length > 0 && selectedSubAccountIds.length !== filteredSubAccounts.length
          ? groupPartialCountLabel(selectedSubAccountIds.length, filteredSubAccounts.length)
          : groupCountLabel(filteredSubAccounts.length)
        : parentAccount?.name,
    },
  };

  return {
    subAccounts,
    onSelectSubAccount,
    getSubAccountLabel,
    partyIdsOverride: selectedSubAccountIds,
    searchable: subAccounts.length > 2,
    subAccountGroups: groups,
    showPageLabel,
    accountNavigatorHidden,
  };
};
