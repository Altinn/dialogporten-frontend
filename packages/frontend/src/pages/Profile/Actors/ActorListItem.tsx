import { Badge, IconButton, ListItem } from '@altinn/altinn-components';
import { HeartFillIcon, HeartIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useNavigate } from 'react-router-dom';
import { useParties } from '../../../api/hooks/useParties';
import { addFavoriteActor, deleteFavoriteActor } from '../../../api/queries';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import { PageRoutes } from '../../routes';

interface PartyListItemProps {
  party: PartyFieldsFragment;
  forceExpand?: boolean;
  isFavorite?: boolean;
}

export const PartyListItem = ({ party, forceExpand = false, isFavorite = false }: PartyListItemProps) => {
  const hasSubParties = (party.subParties ?? []).length > 0;
  const isOrganization = party.partyType === 'Organization';
  const { setSelectedPartyIds } = useParties();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const handleToggleFavoriteActor = () => {
    if (isFavorite) {
      deleteFavoriteActor(party.party).then(() => {
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      });
    } else {
      addFavoriteActor(party.party).then(() => {
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      });
    }
  };

  return (
    <ListItem
      as="button"
      description={`${isOrganization ? 'Org.nr. ' : 'Personnummer: '} ${urnToOrgNr(party.party)}`}
      avatar={{
        type: isOrganization ? 'company' : 'person',
        name: party.name,
        size: 'md',
      }}
      id={party.party}
      expanded={forceExpand || hasSubParties}
      onClick={() => onSelectAccount(party.party, PageRoutes.inbox)}
      title={party.name}
      controls={
        <>
          {hasSubParties && !forceExpand && <Badge label={`+ ${party.subParties?.length} underenheter`} />}
          <IconButton
            icon={isFavorite ? HeartFillIcon : HeartIcon}
            onClick={handleToggleFavoriteActor}
            variant="text"
            iconAltText="Favorite status"
          />
        </>
      }
    >
      {/* {party.subParties?.map((subParty) => (
        <ListItem
          key={subParty.party}
          as="button"
          description={`${isOrganization ? 'Org.nr. ' : 'Personnummer: '} ${urnToOrgNr(subParty.party)}`}
          avatar={{
            type: isOrganization ? 'company' : 'person',
            name: subParty.name,
            size: 'md',
          }}
          id={subParty.party}
          onClick={() => (isFavorite ? deleteFavoriteActor(party.party) : addFavoriteActor(party.party))}
          title={subParty.name}
          theme="transparent"
          controls={
            <IconButton icon={isFavorite ? HeartIcon : HeartFillIcon} variant="text" iconAltText="Favorite status" />
          }
        />
      ))} */}
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
