import { useQueryClient } from '@tanstack/react-query';
import type { GroupObject, ProfileQuery, User } from 'bff-types-generated';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addFavoriteParty,
  deleteFavoriteParty,
  getNotificationsettingsForCurrentUser,
  profile,
  setPreSelectedParty,
  setShouldShowSubEntities,
  setShowClientUnits,
} from '../../api/queries.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useGlobalState, useGlobalStringState } from '../../useGlobalState.ts';
import type { PreselectedPartyOperationType } from './PartiesOverviewPage/PartiesOverviewPage.tsx';

interface UseProfileOutput {
  profile: ProfileQuery['profile'] | undefined;
  user: User;
  groups: GroupObject[];
  favoritesGroup: GroupObject | undefined;
  isLoading: boolean;
  isSuccess: boolean;
  language: string;
  shouldShowDeletedEntities: boolean | undefined | null;
  addFavoriteParty: (partyId: string) => Promise<void>;
  deleteFavoriteParty: (partyId: string) => Promise<void>;
  setPreSelectedParty: (partyId: string, operationType: PreselectedPartyOperationType) => Promise<void>;
  setShowClientUnits: (showClientUnits: boolean) => Promise<void>;
  updateShowDeletedEntities: (shouldShow: boolean) => Promise<void>;
  updateProfileLanguage: (language: string) => void;
  getNotificationsettingsForCurrentUser: typeof getNotificationsettingsForCurrentUser;
}

export const useProfile = (disabled?: boolean): UseProfileOutput => {
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

  const handleDeleteFavoriteParty = async (partyId: string) => {
    await deleteFavoriteParty(partyId);
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
  };

  const handleAddFavoriteParty = async (partyId: string) => {
    await addFavoriteParty(partyId);
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
  };

  // Use local state if set, otherwise fall back to server value
  const serverShowDeletedEntities = data?.profile?.user?.profileSettingPreference?.shouldShowDeletedEntities;
  const shouldShowDeletedEntities = localShowDeletedEntities ?? serverShowDeletedEntities;

  const handleSetShowDeletedEntities = async (shouldShow: boolean) => {
    setLocalShowDeletedEntities(shouldShow);
    try {
      await setShouldShowSubEntities(shouldShow);
    } catch {
      setLocalShowDeletedEntities(null);
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
    }
  };

  const handleSetPreSelectedParty = async (partyId: string, operationType: PreselectedPartyOperationType) => {
    await setPreSelectedParty(partyId, operationType);
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
  };

  const handleSetShowClientUnits = async (showClientUnits: boolean) => {
    await setShowClientUnits(showClientUnits);
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
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
    deleteFavoriteParty: handleDeleteFavoriteParty,
    addFavoriteParty: handleAddFavoriteParty,
    setPreSelectedParty: handleSetPreSelectedParty,
    updateShowDeletedEntities: handleSetShowDeletedEntities,
    setShowClientUnits: handleSetShowClientUnits,
    updateProfileLanguage,
    shouldShowDeletedEntities,
  };
};
