import type { PartyFieldsFragment } from 'bff-types-generated';
import { useMemo } from 'react';
import { updateNotificationsetting } from '../../api/queries.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import type { NotificationAccountsType } from './NotificationsPage/NotificationsPage.tsx';
import { useNotificationSettingsForCurrentUser } from './useNotificationSettings.tsx';

export interface UniqueEmailAddressType {
  email: string;
  partyUuid: string;
  name: string;
  type: 'company' | 'person';
  hasParentParty: boolean;
}

export interface GroupedEmailAddressType {
  email: string;
  parties: UniqueEmailAddressType[];
}

export interface UniquePhoneNumberType {
  phoneNumber: string;
  partyUuid: string;
  name: string;
  type: 'company' | 'person';
  hasParentParty: boolean;
}

export interface GroupedPhoneNumberType {
  phoneNumber: string;
  parties: UniquePhoneNumberType[];
}

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

export const usePartiesWithNotificationSettings = (parties: PartyFieldsFragment[]) => {
  const { notificationSettingsForCurrentUser } = useNotificationSettingsForCurrentUser();

  const partiesKey = useMemo(() => {
    if (!parties?.length) return null;
    return parties
      .map((party) => party.partyUuid)
      .sort((a, b) => a.localeCompare(b))
      .join(',');
  }, [parties]);

  const { data: partiesWithNotificationSettings = [], isLoading: isLoadingNotificationSettings } =
    useAuthenticatedQuery<NotificationAccountsType[]>({
      queryKey: [
        QUERY_KEYS.PROFILE_PARTIES_WITH_NOTIFICATION_SETTINGS,
        'all-parties',
        partiesKey,
        notificationSettingsForCurrentUser,
      ],
      queryFn: async () => {
        if (!parties?.length) return [];

        const filteredParties = flattenParties(parties).filter((party) => !party.isCurrentEndUser);

        return await Promise.all(
          filteredParties.map(async (party) => {
            const notificationSettings =
              notificationSettingsForCurrentUser?.find((setting) => setting?.partyUuid === party.partyUuid) ??
              undefined;
            return { ...party, notificationSettings, key: party.partyUuid };
          }),
        );
      },
      enabled: !!parties?.length,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10,
    });

  const uniqueEmailAddresses: GroupedEmailAddressType[] = useMemo(() => {
    const emailMap = new Map<string, UniqueEmailAddressType[]>();

    const emails = partiesWithNotificationSettings
      .map(
        (party: NotificationAccountsType) =>
          ({
            email: party.notificationSettings?.emailAddress,
            partyUuid: party.partyUuid,
            name: party.name,
            type: party.partyType === 'Organization' ? 'company' : 'person',
            hasParentParty: !!party.parentId,
          }) as UniqueEmailAddressType,
      )
      .filter(
        (uniqueEmail: UniqueEmailAddressType): uniqueEmail is UniqueEmailAddressType =>
          !!uniqueEmail?.email && uniqueEmail.email.trim().length > 0,
      );

    for (const email of emails) {
      if (!emailMap.has(email.email)) {
        emailMap.set(email.email, []);
      }
      emailMap.get(email.email)!.push(email);
    }

    return Array.from(emailMap.entries()).map(([email, parties]) => ({
      email,
      parties,
    }));
  }, [partiesWithNotificationSettings]);

  const uniquePhoneNumbers: GroupedPhoneNumberType[] = useMemo(() => {
    const phoneNumberMap = new Map<string, UniquePhoneNumberType[]>();

    const phoneNumbers = partiesWithNotificationSettings
      .map(
        (party: NotificationAccountsType) =>
          ({
            phoneNumber: party.notificationSettings?.phoneNumber,
            partyUuid: party.partyUuid,
            name: party.name,
            type: party.partyType === 'Organization' ? 'company' : 'person',
            hasParentParty: !!party.parentId,
          }) as UniquePhoneNumberType,
      )
      .filter(
        (uniquePhoneNumber: UniquePhoneNumberType): uniquePhoneNumber is UniquePhoneNumberType =>
          !!uniquePhoneNumber?.phoneNumber && uniquePhoneNumber.phoneNumber.trim().length > 0,
      );

    for (const phoneNumber of phoneNumbers) {
      if (!phoneNumberMap.has(phoneNumber.phoneNumber)) {
        phoneNumberMap.set(phoneNumber.phoneNumber, []);
      }
      phoneNumberMap.get(phoneNumber.phoneNumber)!.push(phoneNumber);
    }

    return Array.from(phoneNumberMap.entries()).map(([phoneNumber, parties]) => ({
      phoneNumber,
      parties,
    }));
  }, [partiesWithNotificationSettings]);

  return {
    partiesWithNotificationSettings: partiesWithNotificationSettings.filter((party) => !party.isDeleted),
    deletedPartiesWithNotificationSettings: partiesWithNotificationSettings.filter((party) => party.isDeleted),
    uniqueEmailAddresses,
    uniquePhoneNumbers,
    isLoading: isLoadingNotificationSettings,
    updateNotificationsetting,
  };
};
