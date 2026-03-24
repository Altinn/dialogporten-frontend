import type { PartyFieldsFragment } from 'bff-types-generated';
import { useMemo } from 'react';
import { usePartyGraph } from '../../api/hooks/usePartiesSelectors.ts';
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

export const usePartiesWithNotificationSettings = (parties: PartyFieldsFragment[]) => {
  const partyGraph = usePartyGraph();
  const { notificationSettingsForCurrentUser } = useNotificationSettingsForCurrentUser();

  const partiesKey = useMemo(() => {
    if (!parties?.length) return null;
    // Use count as cache key — partyGraph.parties has stable identity via useMemo,
    // so a length change is the only meaningful signal for invalidation.
    return `parties:${parties.length}`;
  }, [parties]);

  const { data: partiesWithNotificationSettings = [], isLoading: isLoadingNotificationSettings } =
    useAuthenticatedQuery<NotificationAccountsType[]>({
      queryKey: [
        QUERY_KEYS.PROFILE_PARTIES_WITH_NOTIFICATION_SETTINGS,
        'all-parties',
        partiesKey,
        notificationSettingsForCurrentUser,
      ],
      queryFn: () => {
        if (!parties?.length) return [];

        // Pre-index notification settings by partyUuid for O(1) lookups
        const settingsByUuid = new Map(
          (notificationSettingsForCurrentUser ?? []).filter((s) => s?.partyUuid).map((s) => [s!.partyUuid, s]),
        );

        return parties
          .filter((party) => !party.isCurrentEndUser)
          .map((party) => ({
            ...party,
            notificationSettings: settingsByUuid.get(party.partyUuid) ?? undefined,
            key: party.partyUuid,
          }));
      },
      enabled: !!parties?.length,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10,
    });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
            hasParentParty: !!partyGraph.partyByUrn.get(party.party)?.parentParty,
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
            hasParentParty: !!partyGraph.partyByUrn.get(party.party)?.parentParty,
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
    partiesWithNotificationSettings: partiesWithNotificationSettings,
    uniqueEmailAddresses,
    uniquePhoneNumbers,
    isLoading: isLoadingNotificationSettings,
    updateNotificationsetting,
  };
};
