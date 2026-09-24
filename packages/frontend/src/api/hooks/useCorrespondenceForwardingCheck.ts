import type { CorrespondenceForwardingCheckQuery } from 'bff-types-generated';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { graphQLSDK } from '../queries.ts';
import { useDialogAccessInfo } from './useDialogAccessInfo.ts';

const correspondenceInstanceRefPattern =
  /^urn:altinn:correspondence-id:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export const getCorrespondenceIdFromInstanceRef = (instanceRef: string | null | undefined): string | undefined =>
  instanceRef?.match(correspondenceInstanceRefPattern)?.[1];

interface UseCorrespondenceForwardingCheckOptions {
  enabled?: boolean;
}

export const useCorrespondenceForwardingCheck = (
  dialogId: string | undefined,
  options: UseCorrespondenceForwardingCheckOptions = {},
) => {
  const { enabled = true } = options;
  const { accessInfo, isLoading: isLookupLoading } = useDialogAccessInfo(dialogId, { enabled });
  const correspondenceId = getCorrespondenceIdFromInstanceRef(accessInfo?.instanceRef);

  const { data, isFetching: isCheckFetching } = useAuthenticatedQuery<CorrespondenceForwardingCheckQuery>({
    queryKey: [QUERY_KEYS.CORRESPONDENCE_FORWARDING_CHECK, correspondenceId],
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => graphQLSDK.correspondenceForwardingCheck({ correspondenceId: correspondenceId! }),
    enabled: enabled && !!correspondenceId,
  });

  return {
    isLoading: isLookupLoading || isCheckFetching,
    allowed: data?.correspondenceForwardingCheck.allowed ?? false,
    correspondenceId,
  };
};
