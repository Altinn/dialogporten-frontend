import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GroupObject, ProfileQuery, User } from 'bff-types-generated';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addFavoriteParty as addFavoritePartyRaw,
  addFavoritePartyToGroup as addFavoritePartyToGroupRaw,
  deleteFavoriteParty as deleteFavoritePartyRaw,
  profile,
} from '../api/queries.ts';
import { QUERY_KEYS } from '../constants/queryKeys.ts';

export const useProfile = () => {
  const { data, isLoading } = useQuery<ProfileQuery>({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: () => profile(),
    refetchOnWindowFocus: false,
  });
  const { i18n } = useTranslation();
  const groups = (data?.profile?.groups as GroupObject[]) || ([] as GroupObject[]);
  const language = data?.profile?.language || i18n.language || 'nb';

  const favoritesGroup = groups.find((group) => group!.isfavorite) as GroupObject;

  const queryClient = useQueryClient();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    if (language !== i18n.language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  const deleteFavoriteParty = (partyId: string, groupId: string) =>
    deleteFavoritePartyRaw(partyId, groupId).then(() => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
    });
  const addFavoriteParty = (partyId: string) =>
    addFavoritePartyRaw(partyId).then(() => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
    });
  const addFavoritePartyToGroup = async (partyId: string, groupName: string) => {
    await addFavoritePartyToGroupRaw(partyId, groupName);
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
  };

  return {
    profile: data?.profile,
    isLoading,
    language,
    user: data?.profile?.user as User,
    groups,
    favoritesGroup,
    deleteFavoriteParty,
    addFavoriteParty,
    addFavoritePartyToGroup,
  };
};
