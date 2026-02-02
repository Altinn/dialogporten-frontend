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

export const useAccountFilters = ({
  searchValue,
  parties,
  includeDeletedParties = true,
}: UseAccountFiltersProps): UseFiltersOutput => {
  const { t } = useTranslation();
  const [filterState, setFilterState] = useState<FilterState>({
    partyScope: [FilterStateEnum.ALL_PARTIES],
  });

  const accountFilters: FilterProps[] = [
    {
      name: 'partyScope',
      label: t('filter_bar.add_filter'),
      items: [
        {
          role: 'radio',
          groupId: '1',
          label: t('parties.filter.all_parties'),
          value: FilterStateEnum.ALL_PARTIES,
        },
        {
          role: 'radio',
          groupId: '2',
          label: t('parties.filter.persons'),
          value: FilterStateEnum.PERSONS,
        },
        {
          role: 'radio',
          groupId: '2',
          label: t('parties.filter.companies'),
          value: FilterStateEnum.COMPANIES,
        },
      ],
    },
  ];

  const getFilterLabel = (_: string, filterValues: (string | number)[] | undefined) => {
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
    let result = includeDeletedParties ? parties : parties.filter((party) => !party.isDeleted);

    if (searchValue.length > 0) {
      const search = searchValue.toLowerCase();
      const normalized = search.trim().toLowerCase();
      const parts = normalized.split(/\s+/);

      result = result.filter((s) => {
        const name = (s.name ?? '').toString().toLowerCase();
        const party = (s.party ?? '').toString().toLowerCase();
        return (
          parts.some((part) => name.includes(part) || party.includes(part)) ||
          name.includes(normalized) ||
          party.includes(normalized)
        );
      });
    }

    result = result.filter((party) => {
      if (filters.includes(FilterStateEnum.ALL_PARTIES)) {
        return true;
      }

      if (filters.includes(FilterStateEnum.COMPANIES) && party.partyType === 'Organization') {
        return true;
      }

      return filters.includes(FilterStateEnum.PERSONS) && party.partyType === 'Person';
    });

    return result;
  }, [parties, filterState, searchValue, includeDeletedParties]);

  const isSearching = searchValue.length > 0 || filterState.partyScope?.[0] !== FilterStateEnum.ALL_PARTIES;

  return { filters: accountFilters, getFilterLabel, filterState, setFilterState, filteredParties, isSearching };
};
