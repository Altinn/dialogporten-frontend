import {
  type AccountListItemProps,
  type AccountListItemType,
  AccountOrganization,
  type AvatarType,
  type BadgeProps,
} from '@altinn/altinn-components';
import { InboxIcon } from '@navikt/aksel-icons';
import type { GroupObject, PartyFieldsFragment, User } from 'bff-types-generated';
import type { ReactNode } from 'react';
import { PageRoutes } from '../../routes';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage';
import { CompanyDetails } from './CompanyDetails';
import { UserDetails } from './UserDetails';
import { getPartyIcon } from './partyFieldToNotificationsList';

export const flattenParties = (parties: NotificationAccountsType[]) => {
  const flattenedParties: NotificationAccountsType[] = [];
  for (const party of parties) {
    flattenedParties.push(party);
    if (party.subParties) {
      for (const subParty of party.subParties) {
        flattenedParties.push({
          ...subParty,
          parentId: party.partyUuid,
        } as NotificationAccountsType);
      }
    }
  }
  return flattenedParties;
};
export const urnToOrgNr = (urn: string, unformatted = false) => {
  if (!urn) return '';
  const identifier = 'identifier-no:';
  const startIndex = urn.indexOf(identifier) + identifier.length;
  const orgOrPersonNumberUnformatted = urn.substring(startIndex);
  if (unformatted) {
    return orgOrPersonNumberUnformatted;
  }
  if (urn.includes('person')) {
    return orgOrPersonNumberUnformatted.slice(0, 6) + ' ' + orgOrPersonNumberUnformatted.slice(6);
  }
  return orgOrPersonNumberUnformatted?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export interface PartyFieldFragmentToAccountListItemProps {
  parties: PartyFieldsFragment[];
  isExpanded: (id: string) => boolean;
  toggleExpanded: (id: string) => void;
  favoritesGroup?: GroupObject;
  addFavoriteParty: (partyId: string) => Promise<void>;
  deleteFavoriteParty: (partyId: string) => Promise<void>;
  navigate: (route: PageRoutes) => void;
  user?: User;
}

export const partyFieldFragmentToAccountList = ({
  parties,
  isExpanded,
  toggleExpanded,
  favoritesGroup,
  addFavoriteParty,
  deleteFavoriteParty,
  navigate,
  user,
}: PartyFieldFragmentToAccountListItemProps) => {
  if (!parties || parties.length === 0) {
    return [];
  }

  const onToggleFavourite = async (isFavorite: boolean, partyUuid: string) => {
    if (!partyUuid) {
      return;
    }
    if (isFavorite) {
      await deleteFavoriteParty(partyUuid);
    } else {
      await addFavoriteParty(partyUuid);
    }
  };

  const getBadge = (party: PartyFieldsFragment): BadgeProps | undefined => {
    if (party.isDeleted) {
      return {
        color: 'alert',
        variant: 'base',
        label: 'Slettet',
      };
    }
    if (party.isCurrentEndUser) {
      return {
        color: 'person',
        label: 'Deg',
      };
    }
    return undefined;
  };

  const flattenedParties = flattenParties(parties);

  const retVal = flattenedParties.map((party) => {
    const favourite = !!(favoritesGroup?.parties?.length && favoritesGroup.parties.some((p) => p === party.partyUuid));

    const isOrganization = party.partyType === 'Organization';

    const icon = getPartyIcon({
      partyName: party.name,
      partyType: isOrganization ? ('company' as AvatarType) : ('person' as AvatarType),
      isSubparty: !!party.parentId,
    });

    const accountListItem = {
      accountIds: undefined,
      badge: getBadge(party),
      favourite,
      id: party.partyUuid,
      isCurrentEndUser: party.isCurrentEndUser,
      isDeleted: party.isDeleted || false,
      parentId: party.parentId,
      name: party.name,
      parentAccount: flattenedParties?.find((item) => item.partyUuid === party.parentId),
      type: party.partyType === 'Person' ? 'person' : 'company',
      title: party.name,
      collapsible: true,
      expanded: isExpanded(party.partyUuid),
      onClick: () => toggleExpanded(party.partyUuid),
      as: 'button',
      icon,
      description: `${isOrganization ? 'Org.nr. ' : 'Fødselsnummer: '} ${urnToOrgNr(party.party)}${party.parentId ? `, del av ${party.name}` : ''}`,
    };
    let children: ReactNode = null;

    if (party.isCurrentEndUser) {
      children = (
        <UserDetails id={party.party} user={user} type={party.partyType as AccountListItemType} name={party.name} />
      );
    } else {
      const accounts = parties?.filter((item) => item.name.includes(party.name)) || [];
      children = (
        <CompanyDetails
          uniqueId={urnToOrgNr(party.party)}
          id={party.party}
          type={accountListItem.type as AccountListItemType}
          name={party.name}
          favourite={favourite}
          onToggleFavourite={() => onToggleFavourite(accountListItem.favourite, party.partyUuid)}
          icon={icon}
          badge={accountListItem.badge}
          party={party}
        >
          {accountListItem.type === 'company' && (
            <AccountOrganization
              items={accounts?.map((item) => ({
                avatar: {
                  type: 'company' as AvatarType,
                  name: item.name,
                  variant:
                    flattenedParties?.find((p) => p.partyUuid === item.partyUuid)?.parentId !== undefined
                      ? 'outline'
                      : undefined,
                },
                items: item.subParties?.map((subParty) => ({
                  avatar: {
                    type: 'company' as AvatarType,
                    name: subParty.name,
                    variant: 'outline',
                  },
                  title: subParty.name,
                  parentId: item.partyUuid,
                  parentAccount: item,
                  description: `${urnToOrgNr(subParty.party)} `,
                  selected: party.partyUuid === subParty.partyUuid,
                  as: 'a',
                })),
                title: item.name,
                description: urnToOrgNr(item.party),
                selected: party.partyUuid === item.partyUuid,
                as: 'a',
              }))}
            />
          )}
        </CompanyDetails>
      );
    }

    return {
      ...accountListItem,
      onToggleFavourite: () => onToggleFavourite(favourite, party.partyUuid),
      children,
      contextMenu: {
        id: accountListItem.id + party.partyUuid + '-menu',
        items: [
          {
            id: party.partyUuid + 'inbox',
            groupId: 'inbox',
            icon: InboxIcon,
            title: 'Gå til Innboks',
            onClick: () => navigate(PageRoutes.inbox),
          },
        ],
      },
    } as AccountListItemProps;
  });

  const self = retVal.filter((party) => party.isCurrentEndUser).map((party) => ({ ...party, groupId: 'self' }));
  const companies = groupParties(
    retVal.filter((party) => !party.favourite && party.type === 'company'),
    'companies',
  );
  const persons = retVal
    .filter((party) => !party.favourite && party.type === 'person' && !party.isCurrentEndUser)
    .map((party, i) => ({ ...party, groupId: i === 0 ? 'persons' : party.name }));
  const favorites = groupParties(
    retVal.filter((party) => party.favourite && !party.isCurrentEndUser),
    'favorites',
  );
  return [...self, ...favorites, ...persons, ...companies];
};

export const groupParties = (parties: AccountListItemProps[], groupId: string) => {
  let grouped = parties.map((party, i) => ({ ...party, groupId: i === 0 ? groupId : party.name }));
  grouped = grouped.map((party) => (party.parentId === grouped[0].id ? { ...party, groupId } : party));
  return grouped;
};
