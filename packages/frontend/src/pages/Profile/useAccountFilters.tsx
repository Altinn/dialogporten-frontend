import type { FilterProps, FilterState, ToolbarFilterProps } from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

enum FilterStateEnum {
  ALL_PARTIES = 'ALL_PARTIES',
  PERSONS = 'PERSONS',
  COMPANIES = 'COMPANIES',
}

interface UseFiltersOutput {
  filters: FilterProps[];
  getFilterLabel: ToolbarFilterProps['getFilterLabel'];
  filterState: FilterState;
  setFilterState: (filterState: FilterState) => void;
  filteredParties: PartyFieldsFragment[];
  isSearching: boolean;
}

interface UseAccountFiltersProps {
  searchValue: string;
  parties: PartyFieldsFragment[];
  includeDeletedParties?: boolean;
}

export const useAccountFilters = ({ searchValue, parties }: UseAccountFiltersProps): UseFiltersOutput => {
  const { t } = useTranslation();
  const [filterState, setFilterState] = useState<FilterState>({
    partyScope: [FilterStateEnum.ALL_PARTIES],
  });

  const accountFilters: FilterProps[] = [
    {
      name: 'partyScope',
      label: t('filter_bar.add_filter'),
      title: t('filter_bar.add_filter'),
      items: [
        {
          role: 'radio',
          name: 'partyScope',
          groupId: '1',
          label: t('parties.filter.all_parties'),
          value: FilterStateEnum.ALL_PARTIES,
        },
        {
          role: 'radio',
          name: 'partyScope',
          groupId: '2',
          label: t('parties.filter.persons'),
          value: FilterStateEnum.PERSONS,
        },
        {
          role: 'radio',
          name: 'partyScope',
          groupId: '2',
          label: t('parties.filter.companies'),
          value: FilterStateEnum.COMPANIES,
        },
      ],
    },
  ];

  const getFilterLabel = (key: string) => {
    const filterValues = filterState[key];

    if (filterValues?.includes(FilterStateEnum.ALL_PARTIES)) {
      return t('parties.filter.all_parties');
    }

    return (
      filterValues
        ?.map((value) => {
          switch (value) {
            case FilterStateEnum.PERSONS:
              return t('parties.filter.persons');
            case FilterStateEnum.COMPANIES:
              return t('parties.filter.companies');
            default:
              return value.toString();
          }
        })
        .join(', ') || t('parties.filter.choose_parties')
    );
  };

  const filteredParties = useMemo(() => {
    const filters = filterState?.partyScope ?? [];
    const filterSet = new Set(filters);
    const isAllParties = filterSet.has(FilterStateEnum.ALL_PARTIES);
    const includeCompanies = isAllParties || filterSet.has(FilterStateEnum.COMPANIES);
    const includePersons = isAllParties || filterSet.has(FilterStateEnum.PERSONS);

    const hasSearch = searchValue.length > 0;
    const normalized = hasSearch ? searchValue.trim().toLowerCase() : '';
    const parts = hasSearch ? normalized.split(/\s+/) : [];

    const result: PartyFieldsFragment[] = [];

    for (const party of parties) {
      if (party.partyType === 'Organization' ? !includeCompanies : !includePersons) continue;

      if (hasSearch) {
        const name = (party.name ?? '').toLowerCase();
        const urn = (party.party ?? '').toLowerCase();
        const matches =
          parts.some((part) => name.includes(part) || urn.includes(part)) ||
          name.includes(normalized) ||
          urn.includes(normalized);
        if (!matches) continue;
      }

      result.push(party);
    }

    return result;
  }, [parties, filterState, searchValue]);

  const isSearching = searchValue.length > 0 || filterState.partyScope?.[0] !== FilterStateEnum.ALL_PARTIES;

  return { filters: accountFilters, getFilterLabel, filterState, setFilterState, filteredParties, isSearching };
};
