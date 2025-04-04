import {
  Avatar,
  AvatarGroup,
  Button,
  Icon,
  ListBase,
  ListItem,
  Searchbar,
  Toolbar,
  Typography,
} from '@altinn/altinn-components';
import { Chip } from '@digdir/designsystemet-react';
import { ArrowDownRightIcon, EnvelopeClosedIcon } from '@navikt/aksel-icons';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParties } from '../../../api/useParties';
import styles from './actors.module.css';

export const Actors = () => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [showSubActors, setShowSubActors] = useState(true);
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
  const partiesToShow = searchValue ? searchResults : parties;

  return (
    <div>
      <h1>Mine aktører</h1>
      <div className={styles.searchContainer}>
        <div>
          <Toolbar
            search={{
              name: 'search',
              placeholder: 'Søk etter aktør',
              value: searchValue,
              onChange: (e) => setSearchValue((e.target as HTMLInputElement).value),
            }}
            showResultsLabel="Vis alle treff"
          />
        </div>
        <div className={styles.selectContainer}>
          <Chip.Radio
            name="underenheter"
            value="underenheter"
            checked={showSubActors}
            onClick={() => setShowSubActors((showSubActors) => !showSubActors)}
          >
            Underenheter
          </Chip.Radio>
          <Chip.Radio
            name="slettede-aktorer"
            value="slettede-aktorer"
            checked={showDeletedActors}
            onClick={() => setShowDeletedActors(!showDeletedActors)}
          >
            Slettede aktører
          </Chip.Radio>
        </div>
      </div>
      <ListBase>
        {partiesToShow.map((party) => (
          <PartyListItem key={party.party} party={party} forceExpand={showSubActors} />
        ))}
      </ListBase>
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
  const isOrganization = party.partyType === 'Organization';

  return (
    <ListItem
      as="button"
      description={`${isOrganization ? 'Org.nr. ' : 'Personnummer: '} ${urnToOrgNr(party.party)}`}
      icon={<Avatar type={isOrganization ? 'company' : 'person'} name={party.name} size="md" />}
      id={party.party}
      expanded={forceExpand || (hasSubParties && isExpanded)}
      // expanded={hasSubParties}
      onClick={() => setIsExpanded(!isExpanded)}
      title={party.name}
      controls={
        <Button>
          <EnvelopeClosedIcon />
        </Button>
      }
      collapsible={hasSubParties}
    >
      {hasSubParties && (
        <div className={styles.partyListExpandedContent}>
          <p className={styles.subpartiesTitle}>Mine underenheter</p>
          {party.subParties?.map((subParty) => (
            <div className={styles.subpartyItem} key={subParty.party}>
              <div>
                <ArrowDownRightIcon fontSize={24} />
              </div>
              <div className={styles.subpartyName}>{subParty.name}</div>
              <div className={styles.subpartyOrgNr}>Org.nr. {urnToOrgNr(subParty.party)}</div>
            </div>
          ))}
        </div>
      )}
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
