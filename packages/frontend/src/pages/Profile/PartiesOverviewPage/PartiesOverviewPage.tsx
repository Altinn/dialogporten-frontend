import { AccountList, Heading, PageBase, PageNav, Section, Toolbar, Typography } from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties';
import { useProfile } from '../../../profile';
import { AddToGroupDialog } from './AddToGroupDialog';
import styles from './partiesOverviewPage.module.css';
import { getBreadcrumbs, partyFieldFragmentToAccountListItem } from './partyFieldToAccountList';

export const PartiesOverviewPage = () => {
  const [searchValue, setSearchValue] = useState('');
  const [chosenParty, setChosenParty] = useState<PartyFieldsFragment | undefined>(undefined);
  const showDeletedParties = false; // TODO: Implement toolbar filter for deleted parties
  const { groups, user, addFavoriteParty, deleteFavoriteParty, favoritesGroup } = useProfile();
  const navigate = useNavigate();
  const addGroupDialogRef = useRef<HTMLDialogElement | null>(null);
  const endUserName = `${user?.party?.person?.firstName || ''} ${user?.party?.person?.lastName}`;
  const { parties: normalParties, isLoading: isLoadingParties, deletedParties } = useParties();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const getPartiesToShow = () => {
    const partiesSource = showDeletedParties ? [...normalParties, ...deletedParties] : normalParties;
    if (searchValue) {
      return partiesSource.filter((party) => party.name.toLowerCase().includes(searchValue.toLowerCase()));
    }
    return partiesSource;
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
    groups: {
      title: 'Grupper',
    },
    secondary: {
      title: 'Andre kontoer',
    },
  };

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
          filters={[
            {
              name: 'type',
              label: 'Alle aktører',
              optionType: 'radio',
              options: [
                {
                  groupId: '1',
                  label: 'Virksomheter',
                  value: 'company',
                },
                {
                  groupId: '1',
                  label: 'Personer',
                  value: 'person',
                },
                {
                  groupId: '1',
                  label: 'Grupper',
                  value: 'group',
                },
                {
                  groupId: '2',
                  type: 'checkbox',
                  name: 'deleted',
                  label: 'Vis slettede enheter',
                  value: 'true',
                },
              ],
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
          })}
        />
      </Section>
    </PageBase>
  );
};
