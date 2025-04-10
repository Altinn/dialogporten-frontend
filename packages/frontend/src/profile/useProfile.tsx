import { useQuery } from '@tanstack/react-query';
import type { ProfileQuery } from 'bff-types-generated';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { profile } from '../api/queries.ts';
import { QUERY_KEYS } from '../constants/queryKeys.ts';

export const useProfile = () => {
  const { data, isLoading } = useQuery<ProfileQuery>({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: () => profile(),
    refetchOnWindowFocus: false,
  });
  const { i18n } = useTranslation();
  const language = data?.profile?.language || i18n.language || 'nb';
  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    if (language !== i18n.language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  return {
    profile: data?.profile,
    isLoading,
    language,
    favoriteActors: data?.profile?.favoriteActors,
  };
};
