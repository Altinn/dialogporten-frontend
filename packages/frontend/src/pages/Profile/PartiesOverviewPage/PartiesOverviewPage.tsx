import {
  AccountList,
  Heading,
  type MenuOptionProps,
  PageBase,
  PageNav,
  Section,
  Toolbar,
  Typography,
} from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import React from 'react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties';
import { FeatureFlagKeys, useFeatureFlag } from '../../../featureFlags';
import { useProfile } from '../../../profile';
import { AddToGroupDialog } from './AddToGroupDialog';
import styles from './partiesOverviewPage.module.css';
import { getBreadcrumbs, partyFieldFragmentToAccountListItem } from './partyFieldToAccountList';

export type FilterState = Record<string, (string | number)[] | undefined>;

export const PartiesOverviewPage = () => {
  const [searchValue, setSearchValue] = useState('');
  const [filterState, setFilterState] = React.useState<FilterState>({});
  const DisableFavoriteGroups = useFeatureFlag(FeatureFlagKeys.DisableFavoriteGroups);

  const [chosenParty, setChosenParty] = useState<PartyFieldsFragment | undefined>(undefined);
  const showDeletedParties = filterState['parties-filter']?.includes('Slettede aktører');
  const showGroups = filterState['parties-filter']?.includes('Slettede aktører');
  const showCompanies = filterState['parties-filter']?.includes('Virksomheter');
  const showPersons = filterState['parties-filter']?.includes('Personer');
  const noFiltersSelected = !filterState['parties-filter'] || filterState['parties-filter']?.length === 0;
  const { groups, user, addFavoriteParty, deleteFavoriteParty, favoritesGroup } = useProfile();
  const navigate = useNavigate();
  const addGroupDialogRef = useRef<HTMLDialogElement | null>(null);
  const endUserName = `${user?.party?.person?.firstName || ''} ${user?.party?.person?.lastName}`;
  const { parties: normalParties, isLoading: isLoadingParties, deletedParties } = useParties();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const getPartiesToShow = () => {
    let partiesToShow = [] as PartyFieldsFragment[];
    if (noFiltersSelected) {
      partiesToShow = normalParties;
    }
    if (showGroups && !DisableFavoriteGroups) {
      return partiesToShow.filter((party) => party.partyType === 'Group');
    }
    if (showCompanies) {
      partiesToShow = [...partiesToShow, ...normalParties.filter((party) => party.partyType === 'Organization')];
    }
    if (showPersons) {
      partiesToShow = [...partiesToShow, ...normalParties.filter((party) => party.partyType === 'Person')];
    }
    if (showDeletedParties) {
      partiesToShow = [...partiesToShow, ...deletedParties];
    }
    if (searchValue) {
      return partiesToShow.filter((party) => party.name.toLowerCase().includes(searchValue.toLowerCase()));
    }
    return partiesToShow;
  };

  const toggleExpanded = (id: string) => {
    console.info('Toggling expanded state for:', id);
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const isExpanded = (id: string) => {
    return expandedItems.includes(id);
  };

  const parties = getPartiesToShow();
  if (isLoadingParties) {
    return (
      <div className={styles.noResults}>
        <Typography>Insert Skeleton here</Typography>
      </div>
    );
  }

  const accountListGroups = {
    primary: {
      title: 'Deg selv',
    },
    favourites: {
      title: 'Favoritter',
    },
    ...(!DisableFavoriteGroups ? { groups: { title: 'Grupper' } } : {}),
    secondary: {
      title: 'Andre kontoer',
    },
  };

  const filterOptions = [
    {
      groupId: '2',
      type: 'checkbox',
      label: 'Personer',
      value: 'Personer',
    },
    {
      groupId: '2',
      type: 'checkbox',
      label: 'Virksomheter',
      value: 'Virksomheter',
    },
    {
      groupId: '3',
      type: 'checkbox',
      label: 'Slettede aktører',
      value: 'Slettede aktører',
    },
  ];

  if (!DisableFavoriteGroups) {
    filterOptions.push({
      groupId: '1',
      type: 'checkbox',
      label: 'Grupper',
      value: 'Grupper',
    });
  }

  return (
    <PageBase color="person">
      <PageNav breadcrumbs={getBreadcrumbs(endUserName)} />
      <Section as="header" spacing={6}>
        <Heading size="xl">Mine aktører og favoritter</Heading>
        <Toolbar
          search={{
            name: 'party-search',
            placeholder: 'Søk etter aktør',
            value: searchValue,
            onChange: (e) => setSearchValue((e.target as HTMLInputElement).value),
            onClear: () => setSearchValue(''),
          }}
          filterState={filterState}
          onFilterStateChange={setFilterState}
          filters={[
            {
              name: 'parties-filter',
              label: filterState['parties-filter']?.map((i) => i.toString()).join(', ') || 'Alle aktører',
              options: filterOptions as MenuOptionProps[],
              optionType: 'checkbox',
            },
          ]}
        />
      </Section>

      <Section spacing={6}>
        <AddToGroupDialog dialogRef={addGroupDialogRef} chosenParty={chosenParty} />
        <AccountList
          groups={accountListGroups}
          items={partyFieldFragmentToAccountListItem({
            parties,
            dialogRef: addGroupDialogRef,
            isExpanded,
            toggleExpanded,
            user,
            favoritesGroup,
            addFavoriteParty,
            deleteFavoriteParty,
            groups,
            setChosenParty,
            navigate,
            disableFavoriteGroups: !!DisableFavoriteGroups,
          })}
        />
      </Section>
    </PageBase>
  );
};
