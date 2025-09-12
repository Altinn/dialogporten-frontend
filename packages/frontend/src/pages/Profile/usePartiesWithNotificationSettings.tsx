import { useQuery } from '@tanstack/react-query';
import type { NotificationSettingsResponse } from 'bff-types-generated';
import { useMemo } from 'react';
import { useParties } from '../../api/hooks/useParties.ts';
import { getNotificationsettingsByUuid, updateNotificationsetting } from '../../api/queries.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import type { NotificationAccountsType } from './NotificationsPage/AccountSettings.tsx';
import { flattenParties } from './PartiesOverviewPage/partyFieldToNotificationsList.tsx';

export const usePartiesWithNotificationSettings = () => {
  const { parties, isLoading: isLoadingParties } = useParties();

  const partiesKey = useMemo(() => {
    if (!parties?.length) return null;
    return parties
      .map((party) => party.partyUuid)
      .sort((a, b) => a.localeCompare(b))
      .join(',');
  }, [parties]);

  const { data: partiesWithNotificationSettings = [], isLoading: isLoadingNotificationSettings } = useQuery<
    NotificationAccountsType[]
  >({
    queryKey: [QUERY_KEYS.PROFILE_PARTIES_WITH_NOTIFICATION_SETTINGS, 'all-parties', partiesKey],
    queryFn: async () => {
      if (!parties?.length) return [];

      const filteredParties = flattenParties(parties)
        .filter((party) => !party.isCurrentEndUser)
        .filter((party) => party.partyType === 'Organization');

      const partiesWithSettings = await Promise.all(
        filteredParties.map(async (party) => {
          const data = await getNotificationsettingsByUuid(party.partyUuid);
          const notificationSettings = (data?.notificationsettingsByUuid as NotificationSettingsResponse) || null;
          return { ...party, notificationSettings, key: party.partyUuid };
        }),
      );

      return partiesWithSettings;
    },
    enabled: !!parties?.length && !isLoadingParties,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10,
  });

  const uniqueEmailAddresses = useMemo(() => {
    const emails = partiesWithNotificationSettings
      .map((party) => ({
        email: party.notificationSettings?.emailAddress,
        partyUuid: party.partyUuid,
        name: party.name,
      }))
      .filter(
        (uniqueEmail): uniqueEmail is { email: string; partyUuid: string; name: string } =>
          !!uniqueEmail?.email && uniqueEmail.email.trim().length > 0,
      );

    const emailMap = new Map<string, { email: string; partyUuids: string[]; usedByPartyNames: string[] }>();

    for (const entry of emails) {
      if (!emailMap.has(entry.email)) {
        emailMap.set(entry.email, {
          email: entry.email,
          partyUuids: [entry.partyUuid],
          usedByPartyNames: [entry.name],
        });
      } else {
        const obj = emailMap.get(entry.email)!;
        obj.partyUuids.push(entry.partyUuid);
        obj.usedByPartyNames.push(entry.name);
      }
    }
    return Array.from(emailMap.values());
  }, [partiesWithNotificationSettings]);

  const uniquePhoneNumbers = useMemo(() => {
    const phoneNumbers = partiesWithNotificationSettings
      .map((party) => ({
        phoneNumber: party.notificationSettings?.phoneNumber,
        partyUuid: party.partyUuid,
        name: party.name,
      }))
      .filter(
        (uniquePhoneNumber): uniquePhoneNumber is { phoneNumber: string; partyUuid: string; name: string } =>
          !!uniquePhoneNumber?.phoneNumber && uniquePhoneNumber.phoneNumber.trim().length > 0,
      );

    const phoneNumberMap = new Map<string, { phoneNumber: string; partyUuids: string[]; usedByPartyNames: string[] }>();

    for (const entry of phoneNumbers) {
      if (!phoneNumberMap.has(entry.phoneNumber)) {
        phoneNumberMap.set(entry.phoneNumber, {
          phoneNumber: entry.phoneNumber,
          partyUuids: [entry.partyUuid],
          usedByPartyNames: [entry.name],
        });
      } else {
        const obj = phoneNumberMap.get(entry.phoneNumber)!;
        obj.partyUuids.push(entry.partyUuid);
        obj.usedByPartyNames.push(entry.name);
      }
    }
    return Array.from(phoneNumberMap.values());
  }, [partiesWithNotificationSettings]);

  const isLoading = isLoadingParties || isLoadingNotificationSettings;

  return {
    partiesWithNotificationSettings,
    uniqueEmailAddresses,
    isLoading,
    updateNotificationsetting,
    uniquePhoneNumbers,
  };
};
