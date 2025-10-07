import {
  type AccountListItemProps,
  type AvatarSize,
  type AvatarType,
  type BadgeProps,
  Typography,
} from '@altinn/altinn-components';
import type { NotificationAccountsType } from '../NotificationsPage/NotificationsPage';
import { groupParties, urnToOrgNr } from './partyFieldToAccountList';

export const getPartyIcon = ({
  partyName,
  partyType,
  isSubparty,
}: { partyName: string; partyType: AvatarType; isSubparty: boolean }) => {
  if (!partyName || !partyType) {
    return null;
  }

  return {
    type: partyType,
    variant: isSubparty ? 'outline' : undefined,
    name: partyName,
    size: 'md' as AvatarSize,
  };
};

export const getEnabledNotificationsBadge = (
  notificationEmailAddress: string,
  notificationPhoneNumber: string,
  isDeleted?: boolean,
) => {
  if (isDeleted) {
    return {
      color: 'alert',
      variant: 'base',
      label: 'Slettet',
    };
  }
  if (notificationEmailAddress && notificationPhoneNumber) {
    return {
      color: 'company' as BadgeProps['color'],
      label: 'SMS og E-post',
    };
  }
  if (notificationPhoneNumber) {
    return {
      color: 'company' as BadgeProps['color'],
      label: 'SMS',
    };
  }
  if (notificationEmailAddress) {
    return {
      color: 'company' as BadgeProps['color'],
      label: 'E-post',
    };
  }
  return <Typography size="xs">Sett opp varsling</Typography>;
};

export interface PartyFieldFragmentToNotificationsListItemProps {
  flattenedParties: NotificationAccountsType[];
  setNotificationParty: (notification: NotificationAccountsType | null) => void;
}

export const partyFieldFragmentToNotificationsListItem = ({
  flattenedParties,
  setNotificationParty,
}: PartyFieldFragmentToNotificationsListItemProps) => {
  if (!flattenedParties || flattenedParties.length === 0) {
    return [];
  }

  const retVal = flattenedParties.map((party) => {
    const isOrganization = party.partyType === 'Organization';

    const icon = getPartyIcon({
      partyName: party.name,
      partyType: isOrganization ? ('company' as AvatarType) : ('person' as AvatarType),
      isSubparty: !!party.parentId,
    });

    return {
      accountIds: undefined,
      badge: getEnabledNotificationsBadge(
        party?.notificationSettings?.emailAddress || '',
        party?.notificationSettings?.phoneNumber || '',
        party.isDeleted,
      ),
      emailAlerts: true,
      linkIcon: true,
      parentId: party.parentId,
      id: party.partyUuid,
      groupId: party.partyType === 'Person' ? 'persons' : 'companies',
      isCurrentEndUser: party.isCurrentEndUser,
      isDeleted: party.isDeleted || false,
      type: party.partyType === 'Person' ? 'person' : 'company',
      title: party.name,
      collapsible: false,
      name: party.name,
      onClick: () => setNotificationParty(party),
      as: 'button',
      icon,
      description: `${isOrganization ? 'Org.nr. ' : 'Fødselsnummer: '} ${urnToOrgNr(party.party)}${party.parentId ? `, del av ${party.name}` : ''}`,
    } as AccountListItemProps;
  });

  const self = retVal.filter((party) => party.isCurrentEndUser).map((party) => ({ ...party, groupId: 'self' }));
  const companies = groupParties(
    retVal.filter((party) => party.type === 'company'),
    'companies',
  );
  const persons = retVal
    .filter((party) => party.type === 'person' && !party.isCurrentEndUser)
    .map((party, i) => ({ ...party, groupId: i === 0 ? 'persons' : party.name }));

  return [...self, ...persons, ...companies];
};
