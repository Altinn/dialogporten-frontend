import {
  Avatar,
  Badge,
  IconButton,
  ListBase,
  ListItem,
  MenuSearch,
  PageNav,
  Searchbar,
  Toolbar,
  ToolbarSearch,
  Typography,
} from '@altinn/altinn-components';
import { Alert, Chip } from '@digdir/designsystemet-react';
import { HeartFillIcon, HeartIcon } from '@navikt/aksel-icons';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './actors.module.css';
import { PageRoutes } from '../../routes';
import { useNavigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties';
import { se } from 'date-fns/locale';

const actorIsFavorite = (party: PartyFieldsFragment) => {
  // Below logic to be replaced with actual logic to determine if the party is a favorite
  // For now, we are just checking if the party name contains the letter 'e'
  return party.subParties?.some((subParty) => subParty.name.includes('e')) ?? false;
};

export const Actors = () => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [showSubActors, setShowSubActors] = useState(false);
  const [showDeletedActors, setShowDeletedActors] = useState(false);

  const {
    selectedParties,
    allOrganizationsSelected,
    parties: normalParties,
    partiesEmptyList,
    isLoading: isLoadingParties,
    deletedParties,
  } = useParties();

  const parties = showDeletedActors ? [...normalParties, ...deletedParties] : normalParties;
  const searchResults = parties?.filter((party) => party.name.toLowerCase().includes(searchValue.toLowerCase()));
  if (isLoadingParties) {
    return (
      <div className={styles.noResults}>
        <Typography>Insert Skeleton here</Typography>
      </div>
    );
  }
  const favoriteParties = searchValue
    ? searchResults
    : parties.map((party) => (actorIsFavorite(party) ? party : null)).filter((party) => party !== null);
  const nonFavoriteParties = searchValue
    ? searchResults
    : parties.map((party) => (!actorIsFavorite(party) ? party : null)).filter((party) => party !== null);
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
      <Alert className={styles.alert} data-color="info">
        <Typography>
          <div className={styles.alertTitle}>På denne siden kan du organisere, favorisere og...</div>
          Her må vi legge inn utfyllende informasjon om maks antall aktører, favoritter o.l.
        </Typography>
      </Alert>
      <div className={styles.searchContainer}>
        <button type="button" onClick={() => console.log('selectedParties', selectedParties)}>
          {selectedParties.length} aktører valgt
        </button>
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
            {/* <Chip.Radio
              name="underenheter"
              value="underenheter"
              checked={showSubActors}
              data-size="md"
              onClick={() => setShowSubActors((showSubActors) => !showSubActors)}
            >
              Underenheter
            </Chip.Radio>
            <Chip.Radio
              name="slettede-aktorer"
              value="slettede-aktorer"
              data-size="md"
              checked={showDeletedActors}
              onClick={() => setShowDeletedActors(!showDeletedActors)}
            >
              Slettede aktører
            </Chip.Radio> */}
          </div>
        </Toolbar>
      </div>
      {favoriteParties.length > 0 && (
        <div>
          <h3>{favoriteParties.length > 0 ? 'Mine favoritter' : 'Mine aktører'}</h3>
          <ListBase>
            {favoriteParties.map((party) => (
              <PartyListItem key={party.party} party={party} forceExpand={showSubActors} />
            ))}
          </ListBase>
        </div>
      )}
      {nonFavoriteParties.length > 0 && (
        <div>
          <h3>{favoriteParties.length > 0 ? 'Øvrige aktører (A-Å)' : 'Mine aktører'}</h3>
          <ListBase>
            {nonFavoriteParties.map((party) => (
              <PartyListItem key={party.party} party={party} forceExpand={showSubActors} />
            ))}
          </ListBase>
        </div>
      )}
    </div>
  );
};

interface PartyListItemProps {
  party: PartyFieldsFragment;
  forceExpand?: boolean;
}

const PartyListItem = ({ party, forceExpand = false }: PartyListItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubParties = (party.subParties ?? []).length > 0;
  const [isFavorite, setIsFavorite] = useState(hasSubParties);
  const isOrganization = party.partyType === 'Organization';
  const { setSelectedPartyIds } = useParties();
  const navigate = useNavigate();

  const {
    selectedParties,
    allOrganizationsSelected,
    parties: normalParties,
    partiesEmptyList,
    isLoading: isLoadingParties,
    deletedParties,
  } = useParties();

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

  return (
    <ListItem
      as="button"
      description={`${isOrganization ? 'Org.nr. ' : 'Personnummer: '} ${urnToOrgNr(party.party)}`}
      icon={<Avatar type={isOrganization ? 'company' : 'person'} name={party.name} size="md" />}
      id={party.party}
      expanded={forceExpand || (hasSubParties && isExpanded)}
      onClick={() => onSelectAccount(party.party, PageRoutes.inbox)}
      title={party.name}
      controls={
        <>
          {hasSubParties && !forceExpand && <Badge label={`+ ${party.subParties?.length} underenheter`} />}
          <IconButton
            icon={isFavorite ? HeartIcon : HeartFillIcon}
            onClick={() => setIsFavorite((prev) => !prev)}
            variant="text"
            iconAltText="Favorite status"
          />
        </>
      }
    >
      {party.subParties?.map((subParty) => (
        <ListItem
          key={subParty.party}
          as="button"
          description={`${isOrganization ? 'Org.nr. ' : 'Personnummer: '} ${urnToOrgNr(subParty.party)}`}
          icon={<Avatar type={isOrganization ? 'company' : 'person'} name={subParty.name} size="md" />}
          id={subParty.party}
          onClick={() => setIsFavorite((prev) => !prev)}
          title={subParty.name}
          theme="transparent"
          controls={
            <IconButton icon={isFavorite ? HeartIcon : HeartFillIcon} variant="text" iconAltText="Favorite status" />
          }
          className={styles.removeme}
        />
      ))}
    </ListItem>
  );
};

const urnToOrgNr = (urn: string) => {
  const identifier = 'identifier-no:';
  const startIndex = urn.indexOf(identifier) + identifier.length;
  const orgOrPersonNumber = urn.substring(startIndex);
  if (urn.includes('person')) {
    return orgOrPersonNumber.slice(0, 6) + ' ' + orgOrPersonNumber.slice(6);
  }
  return orgOrPersonNumber?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
