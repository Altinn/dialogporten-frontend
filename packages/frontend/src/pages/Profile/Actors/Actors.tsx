import { useTranslation } from 'react-i18next';
import { useParties } from '../../../api/useParties';
import {
  Avatar,
  AvatarGroup,
  Icon,
  ListBase,
  ListItem,
  Searchbar,
  Toolbar,
  Typography,
} from '@altinn/altinn-components';
import { useState } from 'react';
import styles from './actors.module.css';
import { Chip } from '@digdir/designsystemet-react';
import { PartyFieldsFragment } from 'bff-types-generated';
import { ArrowDownRightIcon } from '@navikt/aksel-icons';

export const Actors = () => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const {
    selectedParties,
    allOrganizationsSelected,
    parties,
    partiesEmptyList,
    isLoading: isLoadingParties,
  } = useParties();
  const searchResults = parties?.filter((party) => party.name.toLowerCase().includes(searchValue.toLowerCase()));
  const partiesToShow = searchValue ? searchResults : parties;

  return (
    <div>
      <h1>Mine aktører</h1>
      <div className={styles.searchContainer}>
        {/* <Searchbar
          expanded
          name="search"
          placeholder="Søk etter aktør"
          onChange={(e) => setSearchValue((e.target as HTMLInputElement).value)}
          value={searchValue}
          className={styles.searchBar}
        /> */}
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
          <Chip.Radio name="underenheter" value="underenheter">
            Underenheter
          </Chip.Radio>
          <Chip.Radio name="slettede-aktorer" value="slettede-aktorer">
            Slettede aktører
          </Chip.Radio>
        </div>
      </div>
      <ListBase>
        {partiesToShow.map((party) => (
          <PartyListItem key={party.party} party={party} />
        ))}
      </ListBase>
    </div>
  );
};

interface PartyListItemProps {
  party: PartyFieldsFragment;
}

const PartyListItem = ({ party }: PartyListItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubParties = (party.subParties ?? []).length > 0;
  const isOrganization = party.partyType === 'Organization';

  return (
    <ListItem
      as="button"
      description={`${isOrganization ? 'Org.nr. ' : 'Personnummer: '} ${urnToOrgNr(party.party)}`}
      icon={<Avatar type={isOrganization ? 'company' : 'person'} name={party.name} size="md" />}
      id={party.party}
      expanded={hasSubParties && isExpanded}
      // expanded={hasSubParties}
      onClick={() => setIsExpanded(!isExpanded)}
      title={party.name}
      collapsible={hasSubParties}
    >
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
