import {
  type AccountListItemProps,
  type AccountListItemType,
  type AvatarSize,
  type AvatarType,
  type BadgeProps,
  Typography,
} from '@altinn/altinn-components';
import type { NotificationAccountsType } from '../NotificationsPage/AccountSettings';
import { urnToOrgNr } from './partyFieldToAccountList';

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
    variant: isSubparty ? 'outline' : 'default',
    name: partyName,
    size: 'md' as AvatarSize,
  };
};

export const getEnabledNotificationsBadge = (notificationEmailAddress: string, notificationPhoneNumber: string) => {
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
      ),
      emailAlerts: true,
      linkIcon: true,
      parentId: party.parentId,
      id: party.partyUuid,
      groupId: party.parentId || party.partyUuid,
      isCurrentEndUser: party.isCurrentEndUser,
      isDeleted: party.isDeleted || false,
      smsAlerts: true,
      type: party.partyType as AccountListItemType,
      title: party.name,
      collapsible: false,
      name: party.name,
      onClick: () => setNotificationParty(party),
      as: 'button',
      icon,
      description: `${isOrganization ? 'Org.nr. ' : 'Fødselsnummer: '} ${urnToOrgNr(party.party)}${party.parentId ? `, del av ${party.name}` : ''}`,
    } as AccountListItemProps;
  });
  return retVal;
};
