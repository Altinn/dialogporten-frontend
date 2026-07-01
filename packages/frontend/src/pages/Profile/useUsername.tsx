import { useQueryClient } from '@tanstack/react-query';
import type { PartyUsernameQuery } from 'bff-types-generated';
import { useState } from 'react';
import { getPartyUsername, setUsername } from '../../api/queries.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';

interface SaveUsernameResult {
  success: boolean;
  message?: string | null;
}

interface UseUsernameOutput {
  username: string | null;
  isLoading: boolean;
  isSaving: boolean;
  saveUsername: (value: string | null) => Promise<SaveUsernameResult>;
}

export const useUsername = (partyUuid?: string): UseUsernameOutput => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = useAuthenticatedQuery<PartyUsernameQuery>({
    queryKey: [QUERY_KEYS.USERNAME, partyUuid],
    queryFn: () => getPartyUsername(partyUuid as string),
    enabled: !!partyUuid,
    refetchOnWindowFocus: false,
  });

  const saveUsername = async (value: string | null): Promise<SaveUsernameResult> => {
    setIsSaving(true);
    try {
      const response = await setUsername(value);
      const result = response.setUsername ?? { success: false };
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERNAME, partyUuid] });
      }
      return result;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    username: data?.partyUsername?.username ?? null,
    isLoading,
    isSaving,
    saveUsername,
  };
};
