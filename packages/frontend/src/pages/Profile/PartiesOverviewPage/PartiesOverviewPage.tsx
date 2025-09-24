import {
  AccountList,
  type FilterState,
  Heading,
  PageBase,
  PageNav,
  Section,
  Toolbar,
  type ToolbarFilterProps,
  Typography,
} from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '..';
import { useParties } from '../../../api/hooks/useParties';
import { FeatureFlagKeys, useFeatureFlag } from '../../../featureFlags';
import { usePageTitle } from '../../../hooks/usePageTitle';
import styles from './partiesOverviewPage.module.css';
import { getBreadcrumbs, partyFieldFragmentToAccountListItem } from './partyFieldToAccountList';

export const PartiesOverviewPage = () => {
  const { t } = useTranslation();

  const FILTER_VALUES = {
    PERSONS: t('parties.filter.persons'),
    COMPANIES: t('parties.filter.companies'),
    DELETED_PARTIES: t('parties.filter.deleted_parties'),
    GROUPS: t('parties.filter.groups'),
  } as const;
  const [searchValue, setSearchValue] = useState('');
  const [filterState, setFilterState] = React.useState<FilterState>({
    'parties-filter': [FILTER_VALUES.PERSONS, FILTER_VALUES.COMPANIES],
  });
  const DisableFavoriteGroups = useFeatureFlag(FeatureFlagKeys.DisableFavoriteGroups);

  const noFiltersSelected = !filterState['parties-filter'] || filterState['parties-filter']?.length === 0;
  const { groups, user, addFavoriteParty, deleteFavoriteParty, favoritesGroup } = useProfile();
  const navigate = useNavigate();
  const endUserName = `${user?.party?.person?.firstName || ''} ${user?.party?.person?.lastName}`;
  const { parties: normalParties, isLoading: isLoadingParties, deletedParties } = useParties();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  usePageTitle({ baseTitle: t('component.parties_overview') });

  const filteredParties = React.useMemo(() => {
    const showDeletedParties = filterState['parties-filter']?.includes(FILTER_VALUES.DELETED_PARTIES);
    const showGroups = filterState['parties-filter']?.includes(FILTER_VALUES.GROUPS);
    const showCompanies = filterState['parties-filter']?.includes(FILTER_VALUES.COMPANIES);
    const showPersons = filterState['parties-filter']?.includes(FILTER_VALUES.PERSONS);
    let filteredParties: PartyFieldsFragment[] = [];
    if (noFiltersSelected) {
      return filteredParties;
    }
    if (showGroups && !DisableFavoriteGroups) {
      return normalParties.filter((party) => party.partyType === 'Group');
    }
    if (showCompanies) {
      const companiesToShow = normalParties.filter((party) => party.partyType === 'Organization');
      filteredParties = [...filteredParties, ...companiesToShow];
    }
    if (showPersons) {
      const personsToShow = normalParties.filter((party) => party.partyType === 'Person');
      filteredParties = [...filteredParties, ...personsToShow];
    }
    if (showDeletedParties) {
      filteredParties = [...filteredParties, ...deletedParties];
    }
    if (searchValue) {
      return filteredParties.filter((party) => party.name.toLowerCase().includes(searchValue.toLowerCase()));
    }
    return filteredParties;
  }, [
    noFiltersSelected,
    DisableFavoriteGroups,
    normalParties,
    filterState,
    deletedParties,
    searchValue,
    FILTER_VALUES,
  ]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const isExpanded = (id: string) => {
    return expandedItems.includes(id);
  };

  if (isLoadingParties) {
    return (
      <div className={styles.noResults}>
        <Typography>Insert Skeleton here</Typography>
      </div>
    );
  }

  const accountListGroups = {
    primary: {
      title: t('parties.groups.self'),
    },
    favourites: {
      title: t('parties.groups.favourites'),
    },
    persons: {
      title: t('parties.groups.favourites'),
    },
    ...(!DisableFavoriteGroups ? { groups: { title: t('parties.groups.groups') } } : {}),
    secondary: {
      title: t('parties.groups.other_accounts'),
    },
  };

  const filterOptions: ToolbarFilterProps[] = [
    {
      optionType: 'checkbox',
      name: 'parties-filter',
      label: t('filter_bar.add_filter"'),
      options: [
        {
          label: t('parties.filter.persons'),
          value: FILTER_VALUES.PERSONS,
        },
        {
          label: t('parties.filter.companies'),
          value: FILTER_VALUES.COMPANIES,
        },
        {
          label: t('parties.filter.deleted_parties'),
          value: FILTER_VALUES.DELETED_PARTIES,
        },
      ],
    },
  ];

  const getFilterLabel = (_: string, filterValues: (string | number)[] | undefined) => {
    if (
      filterValues?.includes(FILTER_VALUES.PERSONS) &&
      !filterValues?.includes(FILTER_VALUES.DELETED_PARTIES) &&
      filterValues?.includes(FILTER_VALUES.COMPANIES)
    ) {
      return t('parties.filter.all_parties');
    }
    return (
      filterValues
        ?.map((value) => {
          switch (value) {
            case FILTER_VALUES.PERSONS:
              return t('parties.filter.persons');
            case FILTER_VALUES.COMPANIES:
              return t('parties.filter.companies');
            case FILTER_VALUES.DELETED_PARTIES:
              return t('parties.filter.deleted_parties');
            case FILTER_VALUES.GROUPS:
              return t('parties.filter.groups');
            default:
              return value.toString();
          }
        })
        .join(', ') || t('parties.filter.choose_parties')
    );
  };
  return (
    <PageBase color="person">
      <PageNav breadcrumbs={getBreadcrumbs(endUserName)} />
      <Section as="header" spacing={6}>
        <Heading size="xl">{t('sidebar.profile.parties')}</Heading>
        <Toolbar
          search={{
            name: 'party-search',
            placeholder: t('parties.search.placeholder'),
            value: searchValue,
            onChange: (e) => setSearchValue((e.target as HTMLInputElement).value),
            onClear: () => setSearchValue(''),
          }}
          getFilterLabel={getFilterLabel}
          filterState={filterState}
          onFilterStateChange={setFilterState}
          filters={filterOptions}
        />
      </Section>

      <Section spacing={6}>
        <AccountList
          groups={accountListGroups}
          items={partyFieldFragmentToAccountListItem({
            parties: filteredParties,
            isExpanded,
            toggleExpanded,
            user,
            favoritesGroup,
            addFavoriteParty,
            deleteFavoriteParty,
            groups,
            navigate,
          })}
        />
      </Section>
    </PageBase>
  );
};
