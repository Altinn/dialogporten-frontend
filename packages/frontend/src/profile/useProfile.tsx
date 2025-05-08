import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileQuery, User } from 'bff-types-generated';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParties } from '../api/hooks/useParties.ts';
import {
  addFavoriteActor as addFavoriteActorRaw,
  addFavoriteActorToGroup as addFavoriteActorToGroupRaw,
  deleteFavoriteActor as deleteFavoriteActorRaw,
  profile,
} from '../api/queries.ts';
import { QUERY_KEYS } from '../constants/queryKeys.ts';

export const useProfile = () => {
  const { data, isLoading } = useQuery<ProfileQuery>({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: () => profile(),
    refetchOnWindowFocus: false,
  });
  const { parties } = useParties();
  const { i18n } = useTranslation();
  const groups = data?.profile?.groups || [];
  const language = data?.profile?.language || i18n.language || 'nb';

  const favoritesGroup = groups.find((group) => group!.isfavorite)?.parties || [];
  const favoriteActors = parties.filter((party) => {
    if (favoritesGroup?.find((actor) => actor?.id!.includes(party.party))) return true;
    if (party.isCurrentEndUser) return true;
    return false;
  });
  const queryClient = useQueryClient();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    if (language !== i18n.language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  const deleteFavoriteActor = (partyId: string, groupId: string) =>
    deleteFavoriteActorRaw(partyId, groupId).then(() => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
    });
  const addFavoriteActor = (partyId: string) =>
    addFavoriteActorRaw(partyId).then(() => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
    });
  const addFavoriteActorToGroup = async (partyId: string, groupName: string) => {
    await addFavoriteActorToGroupRaw(partyId, groupName);
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
  };

  return {
    profile: data?.profile,
    isLoading,
    language,
    user: data?.profile?.user as User,
    groups,
    favoriteActors,
    deleteFavoriteActor,
    addFavoriteActor,
    addFavoriteActorToGroup,
  };
};
