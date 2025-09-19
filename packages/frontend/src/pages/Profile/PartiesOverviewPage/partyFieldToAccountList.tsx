import type { AccountListItemProps, AccountListItemType, AvatarType, BadgeProps } from '@altinn/altinn-components';
import { InboxIcon } from '@navikt/aksel-icons';
import type { GroupObject, PartyFieldsFragment, User } from 'bff-types-generated';
import { t } from 'i18next';
import type { ReactNode } from 'react';
import { toTitleCase } from '..';
import { PageRoutes } from '../../routes';
import { CompanyDetails } from './CompanyDetails';
import { UserDetails } from './UserDetails';
import { flattenParties, getPartyIcon } from './partyFieldToNotificationsList';

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

export const getBreadcrumbs = (name: string) => {
  if (!name) return [];
  return [
    {
      label: t('word.frontpage'),
      href: PageRoutes.inbox,
    },
    {
      label: toTitleCase(name),
      href: PageRoutes.profile,
    },
    {
      label: t('sidebar.profile.parties'),
      href: PageRoutes.partiesOverview,
    },
  ];
};

function filterGroupsByPartyId(groups: GroupObject[], targetPartyId: string): GroupObject[] {
  return groups.filter((group) => group.parties?.some((party) => party === targetPartyId) ?? false);
}

export interface PartyFieldFragmentToAccountListItemProps {
  parties: PartyFieldsFragment[];
  isExpanded: (id: string) => boolean;
  toggleExpanded: (id: string) => void;
  user: User;
  favoritesGroup?: GroupObject;
  addFavoriteParty: (partyId: string) => Promise<void>;
  deleteFavoriteParty: (partyId: string) => Promise<void>;
  groups: GroupObject[];
  navigate: (route: PageRoutes) => void;
}

export const partyFieldFragmentToAccountListItem = ({
  parties,
  isExpanded,
  toggleExpanded,
  favoritesGroup,
  addFavoriteParty,
  deleteFavoriteParty,
  groups,
  navigate,
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
      addFavoriteParty(partyUuid);
    }
  };

  const flattenedParties = flattenParties(parties);
  const retVal = flattenedParties.map((party) => {
    const favourite = !!favoritesGroup?.parties?.find((p) => p?.includes(party.partyUuid));
    let group: GroupObject | undefined = undefined;
    if (favourite) group = favoritesGroup;
    const partyGroups = filterGroupsByPartyId(groups, party.partyUuid);
    const isOrganization = party.partyType === 'Organization';
    let groupId = 'secondary';
    if (party.isCurrentEndUser) {
      groupId = 'primary';
    } else if (favourite) {
      groupId = 'favourites';
    } else {
      groupId = 'secondary';
    }
    const icon = getPartyIcon({
      partyName: party.name,
      partyType: isOrganization ? ('company' as AvatarType) : ('person' as AvatarType),
      isSubparty: !!party.parentId,
    });

    const accountListItem = {
      accountIds: undefined,
      badge: party.isCurrentEndUser
        ? {
            color: 'person' as BadgeProps['color'],
            label: 'Deg',
          }
        : undefined,
      favourite,
      partyGroups,
      groupId,
      id: party.partyUuid,
      isCurrentEndUser: party.isCurrentEndUser,
      isDeleted: party.isDeleted || false,
      parentId: undefined,
      name: party.name,
      parentAccount: flattenedParties?.find((item) => item.partyUuid === party.parentId),
      type: party.partyType as AccountListItemType,
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
      children = <UserDetails id={party.partyUuid} type={party.partyType as AccountListItemType} name={party.name} />;
    } else {
      children = (
        <CompanyDetails
          uniqueId={urnToOrgNr(party.party)}
          id={party.partyUuid}
          type={party.partyType as AccountListItemType}
          name={party.name}
          favourite={favourite}
          onToggleFavourite={() => onToggleFavourite(accountListItem.favourite, party.partyUuid)}
          icon={icon}
          badge={accountListItem.badge}
          party={party}
          parentAccount={accountListItem.parentAccount}
        />
      );
    }

    return {
      ...accountListItem,
      onToggleFavourite: () => onToggleFavourite(favourite, party.partyUuid),
      children,
      contextMenu: {
        id: group?.name + party.partyUuid + '-menu',
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
  return retVal;
};
