import type { DialogAccessInfoQuery } from 'bff-types-generated';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { graphQLSDK } from '../queries.ts';

interface UseDialogAccessInfoOptions {
  enabled?: boolean;
}

export const useDialogAccessInfo = (dialogId: string | undefined, options: UseDialogAccessInfoOptions = {}) => {
  const { enabled = true } = options;
  const instanceRef = dialogId ? `urn:altinn:dialog-id:${dialogId}` : '';

  const { data, isLoading, isError } = useAuthenticatedQuery<DialogAccessInfoQuery>({
    queryKey: [QUERY_KEYS.DIALOG_ACCESS_INFO, dialogId],
    staleTime: 600_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async () => graphQLSDK.dialogAccessInfo({ instanceRef }),
    enabled: enabled && !!dialogId,
  });

  return {
    accessInfo: data?.dialogLookup?.lookup ?? undefined,
    errors: data?.dialogLookup?.errors ?? [],
    isLoading,
    isError,
  };
};
