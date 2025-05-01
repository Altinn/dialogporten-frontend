import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileQuery, User } from 'bff-types-generated';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { addFavoriteActor, deleteFavoriteActor, profile } from '../api/queries.ts';
import { QUERY_KEYS } from '../constants/queryKeys.ts';

export const useProfile = () => {
  const { data, isLoading } = useQuery<ProfileQuery>({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: () => profile(),
    refetchOnWindowFocus: false,
  });
  const { i18n } = useTranslation();
  const language = data?.profile?.language || i18n.language || 'nb';
  const favoriteActors = data?.profile?.favoriteActors;
  const queryClient = useQueryClient();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    if (language !== i18n.language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  const toggleFavoriteActor = (party: string) => {
    const isFavorite = !!favoriteActors?.find((actor) => actor?.includes(party));

    if (isFavorite) {
      deleteFavoriteActor(party).then(() => {
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      });
    } else {
      addFavoriteActor(party).then(() => {
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      });
    }
  };

  return {
    profile: data?.profile,
    isLoading,
    language,
    user: data?.profile?.user as User,
    favoriteActors,
    toggleFavoriteActor,
  };
};
