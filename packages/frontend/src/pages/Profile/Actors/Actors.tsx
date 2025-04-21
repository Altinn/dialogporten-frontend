import { DsAlert, DsChip, ListBase, PageNav, Toolbar, Typography } from '@altinn/altinn-components';
import { useState } from 'react';
import { useParties } from '../../../api/hooks/useParties';
import { useProfile } from '../../../profile';
import { PartyListItem } from './ActorListItem';
import styles from './actors.module.css';

export const Actors = () => {
  const [searchValue, setSearchValue] = useState('');
  const [showSubActors, setShowSubActors] = useState(false);
  const [showDeletedActors, setShowDeletedActors] = useState(false);
  const { favoriteActors, user } = useProfile();

  // TODO: Remove this when we have implemented the new profile API
  console.info('Got user from Core Platform API: ', user);

  const { parties: normalParties, isLoading: isLoadingParties, deletedParties } = useParties();

  const parties = showDeletedActors ? [...normalParties, ...deletedParties] : normalParties;
  if (isLoadingParties) {
    return (
      <div className={styles.noResults}>
        <Typography>Insert Skeleton here</Typography>
      </div>
    );
  }
  const favoriteParties = parties.filter((party) => favoriteActors?.find((actor) => actor?.includes(party.party)));
  const nonFavoriteParties = parties.filter((party) => !favoriteActors?.find((actor) => actor?.includes(party.party)));
  return (
    <div>
      <PageNav
        backButton={{
          label: 'Tilbake',
        }}
        breadcrumbs={[
          {
            label: 'Profilinnstillinger',
          },
          {
            label: 'Mine aktører',
          },
        ]}
      />
      <h1>Innstillinger for Mine aktører</h1>
      <DsAlert className={styles.alert} data-color="info">
        <Typography>
          <div className={styles.alertTitle}>På denne siden kan du organisere, favorisere og...</div>
          Her må vi legge inn utfyllende informasjon om maks antall aktører, favoritter o.l.
        </Typography>
      </DsAlert>
      <div className={styles.searchContainer}>
        <Toolbar
          search={{
            name: 'actor-search',
            placeholder: 'Søk etter aktør',
            value: searchValue,
            onChange: (e) => setSearchValue((e.target as HTMLInputElement).value),
            onClear: () => setSearchValue(''),
          }}
          filters={[
            {
              label: 'Velg avsender',
              name: 'from',
              optionType: 'checkbox',
              options: [
                {
                  label: 'Skatteetaten',
                  value: 'skatt',
                },
                {
                  label: 'Brønnøysundregistrene',
                  value: 'brreg',
                },
                {
                  badge: {
                    label: '10',
                  },
                  label: 'Statisitisk sentralbyrå',
                  value: 'ssb',
                },
                {
                  badge: {
                    label: '14',
                  },
                  label: 'Fagernes kjøtt og data',
                  value: 'fkd',
                },
                {
                  badge: {
                    label: '14',
                  },
                  label: 'Direktoratet for vilt-, kjøtt og datautstyr',
                  value: 'dvkd',
                },
                {
                  label: 'NAV',
                  value: 'nav',
                },
                {
                  label: 'Oslo kommune',
                  value: 'oslo',
                },
              ],
              removable: false,
            },
          ]}
          showResultsLabel="Vis alle treff"
        >
          <div>
            <DsChip.Radio
              name="underenheter"
              value="underenheter"
              checked={showSubActors}
              data-size="md"
              onClick={() => setShowSubActors((showSubActors) => !showSubActors)}
            >
              Underenheter
            </DsChip.Radio>
            <DsChip.Radio
              name="slettede-aktorer"
              value="slettede-aktorer"
              data-size="md"
              checked={showDeletedActors}
              onClick={() => setShowDeletedActors(!showDeletedActors)}
            >
              Slettede aktører
            </DsChip.Radio>
          </div>
        </Toolbar>
      </div>

      {favoriteParties.length > 0 && (
        <div>
          <h3>{favoriteParties.length > 0 ? 'Mine favoritter' : 'Mine aktører'}</h3>
          <ListBase>
            {favoriteParties.map((party) => (
              <PartyListItem
                key={party.party}
                party={party}
                forceExpand={showSubActors}
                isFavorite={!!favoriteActors?.find((actor) => actor?.includes(party.party))}
              />
            ))}
          </ListBase>
        </div>
      )}
      {nonFavoriteParties.length > 0 && (
        <div>
          <h3>{favoriteParties.length > 0 ? 'Øvrige aktører (A-Å)' : 'Mine aktører'}</h3>
          <ListBase>
            {nonFavoriteParties.map((party) => (
              <PartyListItem
                key={party.party}
                party={party}
                forceExpand={showSubActors}
                isFavorite={!!favoriteActors?.find((actor) => actor?.includes(party.party))}
              />
            ))}
          </ListBase>
        </div>
      )}
    </div>
  );
};
