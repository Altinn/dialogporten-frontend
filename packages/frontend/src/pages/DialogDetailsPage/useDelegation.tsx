import type { DialogLookupQuery } from 'bff-types-generated';
import { graphQLSDK } from '../../api/queries.ts';
import { getAccessAMUILink } from '../../auth';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';

interface UseDelegationOutput {
  delegationHref?: string;
}

const getDelegationHref = (instanceUrn: string, resourceId: string, dialogId: string): string => {
  const base = getAccessAMUILink();
  const params = new URLSearchParams({
    instanceUrn,
    resourceId,
    dialogId,
  });
  return `${base}/poa-overview/instance?${params.toString()}`;
};

export const useDelegation = (dialogId?: string): UseDelegationOutput => {
  const instanceRef = `urn:altinn:dialog-id:${dialogId}`;
  const enableDelegationLink = useFeatureFlag('auth.enableDelegationLink');
  const { data, isSuccess } = useAuthenticatedQuery<DialogLookupQuery>({
    queryKey: [QUERY_KEYS.DIALOG_DELEGATION_LOOKUP, dialogId],
    staleTime: 0,
    refetchInterval: 1_200_000,
    refetchOnMount: 'always',
    retry: 3,
    queryFn: async () => graphQLSDK.dialogLookup({ instanceRef: instanceRef }),
    enabled: !!dialogId && !!enableDelegationLink,
  });

  if (!enableDelegationLink) {
    return {
      delegationHref: undefined,
    };
  }

  const isDelagable = data?.dialogLookup?.lookup?.serviceResource?.isDelegable ?? false;

  if (isSuccess && isDelagable) {
    const instanceRef = data?.dialogLookup?.lookup?.instanceRef;
    const serviceResourceId = data?.dialogLookup?.lookup?.serviceResource.id;
    if (instanceRef && serviceResourceId && dialogId) {
      return {
        delegationHref: getDelegationHref(instanceRef, serviceResourceId, dialogId),
      };
    }
  }

  return {
    delegationHref: undefined,
  };
};
