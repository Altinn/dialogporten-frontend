import { useQueryClient } from '@tanstack/react-query';
import type { GroupObject, ProfileQuery, User } from 'bff-types-generated';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addFavoriteParty as addFavoritePartyRaw,
  addFavoritePartyToGroup as addFavoritePartyToGroupRaw,
  deleteFavoriteParty as deleteFavoritePartyRaw,
  getNotificationsettingsForCurrentUser,
  profile,
  updateProfileSettingPreference as updateProfileSettingPreferenceRaw,
} from '../../api/queries.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useGlobalState, useGlobalStringState } from '../../useGlobalState.ts';

export const useProfile = (disabled?: boolean) => {
  const { data, isLoading, isSuccess } = useAuthenticatedQuery<ProfileQuery>({
    queryKey: [QUERY_KEYS.PROFILE],
    staleTime: 10 * 1000 * 30,
    queryFn: () => profile(),
    refetchOnWindowFocus: false,
    enabled: !disabled,
  });

  const { i18n } = useTranslation();
  const groups = (data?.profile?.groups as GroupObject[]) || ([] as GroupObject[]);
  const [updatedLanguage, updateProfileLanguage] = useGlobalStringState(QUERY_KEYS.UPDATED_LANGUAGE, '');
  const language = updatedLanguage || data?.profile?.language || i18n.language || 'nb';
  const favoritesGroup = groups.find((group) => group?.isFavorite);

  const [localShowDeletedEntities, setLocalShowDeletedEntities] = useGlobalState<boolean | null>(
    QUERY_KEYS.SHOW_DELETED_ENTITIES,
    null,
  );

  const queryClient = useQueryClient();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    if (language !== i18n.language) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  const deleteFavoriteParty = (partyId: string) =>
    deleteFavoritePartyRaw(partyId).then(() => {
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

  // Use local state if set, otherwise fall back to server value
  const serverShowDeletedEntities = data?.profile?.user?.profileSettingPreference?.shouldShowDeletedEntities;
  const shouldShowDeletedEntities = localShowDeletedEntities ?? serverShowDeletedEntities;

  const updateShowDeletedEntities = async (shouldShow: boolean) => {
    setLocalShowDeletedEntities(shouldShow);
    try {
      await updateProfileSettingPreferenceRaw(shouldShow);
    } catch {
      setLocalShowDeletedEntities(null);
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
    }
  };

  return {
    profile: data?.profile,
    isLoading,
    language,
    user: data?.profile?.user as User,
    groups,
    favoritesGroup,
    isSuccess,
    getNotificationsettingsForCurrentUser,
    deleteFavoriteParty,
    addFavoriteParty,
    addFavoritePartyToGroup,
    updateProfileLanguage,
    shouldShowDeletedEntities,
    updateShowDeletedEntities,
  };
};
