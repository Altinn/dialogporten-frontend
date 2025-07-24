import {
  type AccountListItemProps,
  type AccountListItemType,
  Avatar,
  type AvatarProps,
  type AvatarSize,
  type AvatarType,
  type BadgeProps,
} from '@altinn/altinn-components';
import { ArrowDownRightIcon, HeartFillIcon, HeartIcon, InboxIcon, PlusCircleIcon } from '@navikt/aksel-icons';
import type { GroupObject, PartyFieldsFragment, User } from 'bff-types-generated';
import { t } from 'i18next';
import type { ReactNode } from 'react';
import { toTitleCase } from '../../../profile';
import { PageRoutes } from '../../routes';
import { CompanyDetails, GroupDetails, UserDetails } from './DetailsComponents';

export const urnToOrgNr = (urn: string) => {
  if (!urn) return '';
  const identifier = 'identifier-no:';
  const startIndex = urn.indexOf(identifier) + identifier.length;
  const orgOrPersonNumber = urn.substring(startIndex);
  if (urn.includes('person')) {
    return orgOrPersonNumber.slice(0, 6) + ' ' + orgOrPersonNumber.slice(6);
  }
  return orgOrPersonNumber?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

interface PartyFields extends PartyFieldsFragment {
  isSubParty?: boolean;
}
export interface PartyFieldFragmentToAccountListItemProps {
  parties: PartyFieldsFragment[];
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  isExpanded: (id: string) => boolean;
  toggleExpanded: (id: string) => void;
  user: User;
  favoritesGroup?: GroupObject;
  addFavoriteParty: (partyId: string) => Promise<void>;
  deleteFavoriteParty: (partyId: string) => Promise<void>;
  groups: GroupObject[];
  setChosenParty: (party: PartyFieldsFragment) => void;
  navigate: (route: PageRoutes) => void;
  disableFavoriteGroups?: boolean;
}

export const partyFieldFragmentToAccountListItem = ({
  parties,
  dialogRef,
  isExpanded,
  toggleExpanded,
  user,
  favoritesGroup,
  addFavoriteParty,
  deleteFavoriteParty,
  groups,
  setChosenParty,
  navigate,
  disableFavoriteGroups = true,
}: PartyFieldFragmentToAccountListItemProps) => {
  if (!parties || parties.length === 0) {
    return [];
  }
  const flattenedParties: PartyFields[] = [];
  for (const party of parties) {
    flattenedParties.push(party);
    if (party.subParties) {
      for (const subParty of party.subParties) {
        flattenedParties.push({
          ...subParty,
          isSubParty: true,
        } as PartyFields);
      }
    }
  }

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

    let icon: AvatarProps | ReactNode = {
      type: isOrganization ? ('company' as AvatarType) : ('person' as AvatarType),
      name: party.name,
      size: 'md' as AvatarSize,
    };

    if (party.isSubParty) {
      icon = (
        <span style={{ position: 'relative' }}>
          <Avatar name={party.name} type={isOrganization ? ('company' as AvatarType) : ('person' as AvatarType)} />
          <div
            data-theme="default"
            style={{
              display: 'flex',
              position: 'absolute',
              fontSize: '.5em',
              bottom: 0,
              right: 0,
              padding: '.125em',
              marginBottom: '-.25em',
              marginRight: '-.5em',
            }}
          >
            <ArrowDownRightIcon style={{ fontSize: '1em' }} aria-label="Subunit" />
          </div>
        </span>
      );
    }

    const contactInfo = party.isCurrentEndUser
      ? {
          email: user?.email || '',
          phone: user?.phoneNumber || '',
          address: `${user?.party?.person?.mailingAddress || ''}, ${user?.party?.person?.mailingPostalCode || ''} ${user?.party?.person?.mailingPostalCity || ''}`,
          name: `${user?.party?.person?.firstName || ''} ${user?.party?.person?.lastName || ''}`,
          uniqueId: user?.party?.person?.ssn || '',
        }
      : {};

    const accountListItem = {
      accountIds: undefined,
      badge: party.isCurrentEndUser
        ? {
            color: 'person' as BadgeProps['color'],
            label: 'Deg',
          }
        : undefined,
      emailAlerts: true,
      favourite,
      partyGroups,
      groupId,
      id: party.partyUuid,
      isCurrentEndUser: party.isCurrentEndUser,
      isDeleted: party.isDeleted || false,
      parentId: undefined,
      smsAlerts: true,
      ...contactInfo,
      type: party.partyType as AccountListItemType,
      title: party.name,
      collapsible: true,
      expanded: isExpanded(party.partyUuid),
      onClick: () => toggleExpanded(party.partyUuid),
      as: 'button',
      icon,
      description: `${isOrganization ? 'Org.nr. ' : 'Fødselsnummer: '} ${urnToOrgNr(party.party)}${party.isSubParty ? `, del av ${party.name}` : ''}`,
    };
    let children: ReactNode = null;

    if (party.isCurrentEndUser) {
      children = (
        <UserDetails
          key={party.partyUuid}
          id={party.partyUuid}
          {...contactInfo}
          type={party.partyType as AccountListItemType}
          name={party.name}
        />
      );
    } else {
      children = (
        <CompanyDetails
          key={party.partyUuid}
          id={party.partyUuid}
          uniqueId={urnToOrgNr(party.party)}
          // parentId={group?.id}
          type={party.partyType as AccountListItemType}
          name={party.name}
          isCurrentEndUser={party.isCurrentEndUser}
          isDeleted={party.isDeleted || false}
          smsAlerts={false} // party.smsAlerts
          emailAlerts={false} // party.emailAlerts
          email={contactInfo.email || ''}
          phone={contactInfo.phone || ''}
          address={contactInfo.address || ''}
          badge={accountListItem.badge}
          items={parties.map((p) => ({
            id: p.party,
            type: p.partyType as AccountListItemType,
            name: p.name,
            title: p.name,
            uniqueId: urnToOrgNr(p.party),
            isCurrentEndUser: p.isCurrentEndUser,
            isDeleted: p.isDeleted || false,
            icon: {
              type: p.partyType === 'Organization' ? ('company' as AvatarType) : ('person' as AvatarType),
              name: p.name,
              size: 'md' as AvatarSize,
            },
          }))}
        />
      );
    }

    return {
      ...accountListItem,
      onToggleFavourite: async () => {
        if (favourite) {
          await deleteFavoriteParty(party.partyUuid);
        } else {
          addFavoriteParty(party.partyUuid);
        }
      },
      children,
      contextMenu: {
        id: group?.name + party.partyUuid + '-menu',
        items: [
          {
            id: party.partyUuid + 'inbox',
            parentId: group?.name + party.partyUuid + '-menu',
            groupId: 'inbox',
            icon: InboxIcon,
            title: 'Gå til Innboks',
            onClick: () => navigate(PageRoutes.inbox),
          },
          ...(!group?.isFavorite && !favourite
            ? [
                {
                  id: party.partyUuid + 'favadd',
                  groupId: 'context',
                  icon: HeartIcon,
                  title: 'Legg til favoritter',
                  onClick: () => addFavoriteParty(party.partyUuid),
                },
              ]
            : []),

          ...(favourite
            ? [
                {
                  id: party.partyUuid + 'favrem',
                  groupId: 'context',
                  icon: HeartFillIcon,
                  title: 'Fjern fra favoritter',
                  onClick: () => {
                    deleteFavoriteParty(party.partyUuid);
                  },
                },
              ]
            : []),

          ...(!disableFavoriteGroups
            ? [
                {
                  id: party.partyUuid + 'new-group',
                  groupId: 'NewGroup',
                  icon: PlusCircleIcon,
                  title: 'Legg til i ny gruppe',
                  onClick: () => {
                    dialogRef?.current?.showModal();
                    console.info('ChosenParty: ', party);
                    setChosenParty(party);
                  },
                },
              ]
            : []),
        ],
      },
    } as AccountListItemProps;
  });

  // Creating groups
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (!group || group.isFavorite || !retVal.length) continue;
    const groupedParties = parties.filter((p) => group.parties?.some((party) => party === p.partyUuid));

    if (groupedParties.length > 0) {
      const accountDetails = {
        accountIds: groupedParties.map((p) => p.party),
        badge: {
          label: `${groupedParties.length} aktører`,
          color: 'alert' as BadgeProps['color'],
        },
        favourite: !!group.isFavorite,
        groupId: 'groups',
        icon: {
          items: groupedParties?.map((p) => {
            return {
              id: p.party,
              name: p.name,
              type: p.partyType,
            };
          }),
        },

        id: group.id?.toString() ?? '',
        isCurrentEndUser: false,
        isDeleted: false,
        name: group.name,
        parentId: undefined,
        phone: undefined,
        smsAlerts: undefined,
        title: group.name,
        type: 'group',
        uniqueId: undefined,
      } as AccountListItemProps;

      retVal.push({
        ...accountDetails,
        children: (
          <GroupDetails
            {...accountDetails}
            items={retVal.filter((accountDetail) => accountDetails.accountIds?.includes(accountDetail.id))}
            id={group.id?.toString() ?? ''}
            accountIds={accountDetails.accountIds}
          />
        ),
        collapsible: true,
        expanded: isExpanded(`group:${group.id}`),
        onClick: () => toggleExpanded(`group:${group.id}`),
        as: 'button',
      } as AccountListItemProps);
    }
  }
  return retVal;
};
